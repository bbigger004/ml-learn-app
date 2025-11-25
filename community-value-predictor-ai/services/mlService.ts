import { DataRow, ModelConfig, ColumnMetadata } from '../types';
import ml5 from 'ml5';

export class MLService {
  private model: any = null;
  // Maps original column names (e.g., "绿化率") to safe internal keys (e.g., "f_0")
  private keyMap: { [original: string]: string } = {};
  private outputKey: string = 'target_y';
  private isReady: boolean = false;

  constructor() {}

  private async waitForTf() {
      // @ts-ignore
      if (ml5.tf) {
        // @ts-ignore
        await ml5.tf.ready();
      }
  }

  /**
   * Initializes a FRESH model instance.
   * We do NOT pass 'inputs' or 'outputs' keys here. We let ml5 infer the structure 
   * from the data we add. This is the most robust way to handle mixed inputs (numbers + one-hot strings).
   */
  private initModel(config?: ModelConfig) {
      // Dispose old model if exists to free memory
      if (this.model) {
          this.model = null;
      }

      const options: any = {
        task: 'regression',
        debug: true, // Enable ml5 internal logging
      };

      // Ideally we could define layers here, but ml5's automatic layer generation 
      // based on input types (embedding/one-hot) is usually better for mixed data.
      // We will rely on defaults but ensure data is clean.
      
      this.model = ml5.neuralNetwork(options);
      this.isReady = false;
  }

  async prepareData(
      data: DataRow[], 
      inputColumns: string[], 
      outputColumn: string,
      metadata: { [key: string]: ColumnMetadata },
      config?: ModelConfig
  ) {
    await this.waitForTf();

    if (!data || data.length === 0) {
        throw new Error("数据集为空");
    }

    // 1. Reset Model
    this.initModel(config);

    // 2. Build Safe Key Mapping
    // This solves issues where Chinese column names or special chars break internal tensor mapping
    this.keyMap = {};
    inputColumns.forEach((col, index) => {
        this.keyMap[col] = `val_${index}`; // Simple ascii keys
    });
    this.outputKey = 'label_y';

    let validRowCount = 0;
    let debugFirstRow = null;

    // 3. Transform and Add Data
    for (const row of data) {
      const inputs: any = {};
      const outputs: any = {};
      let isValid = true;

      // Process Inputs
      for (const col of inputColumns) {
        const safeKey = this.keyMap[col];
        const rawVal = row[col];
        const meta = metadata[col];
        
        // Basic null check
        if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
             isValid = false;
             break;
        }

        if (meta && meta.type === 'category') {
            // Enforce String for categorical (triggers One-Hot internally in ml5)
            inputs[safeKey] = String(rawVal).trim();
        } else {
            // Enforce Number for regression
            const numVal = parseFloat(String(rawVal));
            if (isNaN(numVal)) {
                isValid = false;
                break;
            }
            inputs[safeKey] = numVal;
        }
      }

      // Process Output
      let outVal = row[outputColumn];
      const outNum = parseFloat(String(outVal));
      if (isNaN(outNum)) {
          isValid = false;
      } else {
          // For regression, output must be an array or object with numeric value
          outputs[this.outputKey] = outNum;
      }

      if (isValid) {
        this.model.addData(inputs, outputs);
        validRowCount++;
        if (!debugFirstRow) debugFirstRow = { inputs, outputs };
      }
    }

    if (validRowCount === 0) {
        throw new Error(`没有有效的数值数据用于训练。请检查选中的列是否包含有效数值。`);
    }

    console.log(`[MLService] Prepared ${validRowCount} rows.`);
    console.log(`[MLService] Sample mapped row:`, debugFirstRow);

    // 4. Normalize Data
    // This calculates min/max for numbers and vocabulary for strings
    this.model.normalizeData();
    this.isReady = true;
  }

  async train(
    config: ModelConfig, 
    onEpoch: (epoch: number, loss: number) => void,
    onComplete: () => void
  ) {
    if (!this.model || !this.isReady) throw new Error("Model not initialized. Call prepareData first.");

    const trainingOptions = {
      epochs: config.epochs,
      batchSize: config.batchSize,
      learningRate: config.learningRate // Pass LR if ml5 version supports it in train options
    };

    console.log("[MLService] Starting training with options:", trainingOptions);

    this.model.train(trainingOptions, (epoch: number, loss: any) => {
        const lossValue = typeof loss === 'object' ? loss.loss : loss;
        if (typeof lossValue === 'number') {
            onEpoch(epoch, lossValue);
        } else {
            console.warn("Unexpected loss format:", loss);
        }
    }, () => {
        console.log("[MLService] Training complete");
        onComplete();
    });
  }

  async predict(inputs: any, metadata?: { [key: string]: ColumnMetadata }): Promise<number> {
    if (!this.model) return 0;
    
    // 1. Map user inputs to the Safe Keys used in training
    const processedInputs: any = {};
    const inputCols = Object.keys(this.keyMap);

    for (const originalCol of inputCols) {
        const safeKey = this.keyMap[originalCol];
        const rawVal = inputs[originalCol];
        
        // Must match the type used in prepareData exactly
        if (metadata && metadata[originalCol]?.type === 'category') {
            processedInputs[safeKey] = String(rawVal || "");
        } else {
            const num = parseFloat(String(rawVal));
            processedInputs[safeKey] = isNaN(num) ? 0 : num;
        }
    }

    return new Promise((resolve) => {
      try {
          this.model.predict(processedInputs, (results: any, error: any) => {
            // ml5 callback signature is (error, results) or (results) depending on version/context
            // We handle both safe-ishly
            
            let finalRes = results;
            if (error && !finalRes) {
                 console.error("Predict Error Callback:", error);
                 resolve(0);
                 return;
            }
            
            // Swap if arguments are reversed (common confusion in ml5 versions)
            if (results instanceof Error) {
                console.error("Predict Error:", results);
                resolve(0);
                return;
            }

            if (Array.isArray(finalRes) && finalRes.length > 0) {
                 const item = finalRes[0];
                 // Regression result structure usually: { value: 1234.56, label: 'label_y' }
                 // Or sometimes just { label_y: 1234.56 }
                 
                 if (typeof item.value === 'number') {
                     resolve(item.value);
                 } else if (typeof item[this.outputKey] === 'number') {
                     resolve(item[this.outputKey]);
                 } else {
                     console.warn("Unexpected prediction format:", item);
                     resolve(0);
                 }
            } else {
                 console.warn("Empty prediction result");
                 resolve(0);
            }
          });
      } catch (err) {
          console.error("Prediction exception:", err);
          resolve(0);
      }
    });
  }

  saveModel() {
    if (this.model) {
        this.model.save();
    }
  }

  async loadModel(files: FileList) {
    await this.waitForTf();
    this.initModel(); // Create fresh instance
    
    return new Promise<void>((resolve) => {
        this.model.load(files, () => {
            console.log("模型文件加载完毕");
            this.isReady = true;
            // Note: KeyMap is lost. User must manually match columns.
            // In a real app, we would save metadata.json alongside model.weights.bin
            resolve();
        });
    });
  }
}

export const mlService = new MLService();
