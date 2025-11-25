// UI相关功能

// UI工具类
class UIUtils {
    // 显示通知
    static showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1050';
        notification.style.maxWidth = '350px';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // 显示加载状态
    static showLoading(elementId, message = '加载中...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.disabled = true;
        element.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ${message}
        `;
    }
    
    // 恢复按钮状态
    static resetButton(elementId, originalText) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.disabled = false;
        element.textContent = originalText;
    }
    
    // 格式化数字
    static formatNumber(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return 'N/A';
        return parseFloat(num).toFixed(decimals);
    }
    
    // 格式化百分比
    static formatPercentage(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return 'N/A';
        return `${parseFloat(num).toFixed(decimals)}%`;
    }
    
    // 创建表格
    static createTable(headers, data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建表格元素
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        
        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // 清空容器并添加表格
        container.innerHTML = '';
        container.appendChild(table);
    }
    
    // 创建卡片
    static createCard(title, content, containerId, cardClass = 'card') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建卡片元素
        const card = document.createElement('div');
        card.className = cardClass;
        
        // 创建卡片头部
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.textContent = title;
        
        // 创建卡片内容
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        cardBody.innerHTML = content;
        
        // 组装卡片
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        
        // 添加到容器
        container.appendChild(card);
    }
    
    // 创建进度条
    static createProgressBar(containerId, progress = 0, label = '') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建进度条容器
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress mb-3';
        
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        
        // 添加标签
        if (label) {
            progressBar.textContent = label;
        }
        
        progressContainer.appendChild(progressBar);
        
        // 清空容器并添加进度条
        container.innerHTML = '';
        container.appendChild(progressContainer);
        
        return progressBar;
    }
    
    // 更新进度条
    static updateProgressBar(progressBar, progress, label = '') {
        if (!progressBar) return;
        
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        
        if (label) {
            progressBar.textContent = label;
        }
    }
    
    // 创建模态框
    static createModal(title, content, modalId = 'dynamicModal') {
        // 检查是否已存在同名模态框
        let modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
        
        // 创建模态框元素
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', `${modalId}Label`);
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${modalId}Label">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 返回模态框元素
        return modal;
    }
    
    // 显示模态框
    static showModal(modal) {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        return modalInstance;
    }
    
    // 创建图表容器
    static createChartContainer(containerId, title) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建容器
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        // 创建标题
        if (title) {
            const chartTitle = document.createElement('h5');
            chartTitle.textContent = title;
            chartTitle.className = 'text-center mb-3';
            chartContainer.appendChild(chartTitle);
        }
        
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        
        // 清空容器并添加图表容器
        container.innerHTML = '';
        container.appendChild(chartContainer);
        
        return canvas;
    }
    
    // 创建输入组
    static createInputGroup(label, inputType, inputId, inputPlaceholder = '', containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建输入组
        const inputGroup = document.createElement('div');
        inputGroup.className = 'mb-3';
        
        // 创建标签
        const labelElement = document.createElement('label');
        labelElement.setAttribute('for', inputId);
        labelElement.className = 'form-label';
        labelElement.textContent = label;
        
        // 创建输入元素
        let inputElement;
        
        switch (inputType) {
            case 'text':
            case 'number':
            case 'email':
            case 'password':
                inputElement = document.createElement('input');
                inputElement.type = inputType;
                inputElement.className = 'form-control';
                inputElement.id = inputId;
                inputElement.placeholder = inputPlaceholder;
                break;
                
            case 'select':
                inputElement = document.createElement('select');
                inputElement.className = 'form-select';
                inputElement.id = inputId;
                break;
                
            case 'textarea':
                inputElement = document.createElement('textarea');
                inputElement.className = 'form-control';
                inputElement.id = inputId;
                inputElement.placeholder = inputPlaceholder;
                inputElement.rows = 3;
                break;
                
            default:
                inputElement = document.createElement('input');
                inputElement.type = 'text';
                inputElement.className = 'form-control';
                inputElement.id = inputId;
                inputElement.placeholder = inputPlaceholder;
        }
        
        // 组装输入组
        inputGroup.appendChild(labelElement);
        inputGroup.appendChild(inputElement);
        
        // 添加到容器
        container.appendChild(inputGroup);
        
        return inputElement;
    }
    
    // 创建滑块控件
    static createSlider(label, sliderId, min, max, step, value, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建滑块组
        const sliderGroup = document.createElement('div');
        sliderGroup.className = 'mb-3';
        
        // 创建标签
        const labelElement = document.createElement('label');
        labelElement.setAttribute('for', sliderId);
        labelElement.className = 'form-label';
        labelElement.textContent = `${label}: <span id="${sliderId}Value">${value}</span>`;
        
        // 创建滑块
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'form-range';
        slider.id = sliderId;
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        
        // 添加事件监听器
        slider.addEventListener('input', () => {
            const valueSpan = document.getElementById(`${sliderId}Value`);
            if (valueSpan) {
                valueSpan.textContent = slider.value;
            }
        });
        
        // 组装滑块组
        sliderGroup.innerHTML = '';
        sliderGroup.appendChild(labelElement);
        sliderGroup.appendChild(slider);
        
        // 添加到容器
        container.appendChild(sliderGroup);
        
        return slider;
    }
    
    // 创建选项卡
    static createTabs(tabs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建选项卡导航
        const tabNav = document.createElement('ul');
        tabNav.className = 'nav nav-tabs';
        tabNav.setAttribute('role', 'tablist');
        
        // 创建选项卡内容
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        
        tabs.forEach((tab, index) => {
            const isActive = index === 0;
            const tabId = `${tab.id}-tab`;
            const paneId = `${tab.id}-pane`;
            
            // 创建选项卡导航项
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.setAttribute('role', 'presentation');
            
            const navLink = document.createElement('button');
            navLink.className = isActive ? 'nav-link active' : 'nav-link';
            navLink.id = tabId;
            navLink.setAttribute('type', 'button');
            navLink.setAttribute('role', 'tab');
            navLink.setAttribute('data-bs-toggle', 'tab');
            navLink.setAttribute('data-bs-target', `#${paneId}`);
            navLink.textContent = tab.title;
            
            navItem.appendChild(navLink);
            tabNav.appendChild(navItem);
            
            // 创建选项卡内容
            const tabPane = document.createElement('div');
            tabPane.className = isActive ? 'tab-pane fade show active' : 'tab-pane fade';
            tabPane.id = paneId;
            tabPane.setAttribute('role', 'tabpanel');
            tabPane.innerHTML = tab.content;
            
            tabContent.appendChild(tabPane);
        });
        
        // 清空容器并添加选项卡
        container.innerHTML = '';
        container.appendChild(tabNav);
        container.appendChild(tabContent);
        
        return { tabNav, tabContent };
    }
    
    // 创建折叠面板
    static createCollapse(title, content, collapseId, containerId, expanded = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 创建折叠面板
        const collapseDiv = document.createElement('div');
        collapseDiv.className = 'accordion-item';
        
        // 创建折叠头部
        const collapseHeader = document.createElement('h2');
        collapseHeader.className = 'accordion-header';
        
        const collapseButton = document.createElement('button');
        collapseButton.className = expanded ? 'accordion-button' : 'accordion-button collapsed';
        collapseButton.type = 'button';
        collapseButton.setAttribute('data-bs-toggle', 'collapse');
        collapseButton.setAttribute('data-bs-target', `#${collapseId}`);
        collapseButton.setAttribute('aria-expanded', expanded);
        collapseButton.setAttribute('aria-controls', collapseId);
        collapseButton.textContent = title;
        
        collapseHeader.appendChild(collapseButton);
        
        // 创建折叠内容
        const collapseBody = document.createElement('div');
        collapseBody.id = collapseId;
        collapseBody.className = expanded ? 'accordion-collapse collapse show' : 'accordion-collapse collapse';
        collapseBody.setAttribute('aria-labelledby', `${collapseId}Header`);
        collapseBody.innerHTML = `
            <div class="accordion-body">
                ${content}
            </div>
        `;
        
        // 组装折叠面板
        collapseDiv.appendChild(collapseHeader);
        collapseDiv.appendChild(collapseBody);
        
        // 添加到容器
        container.appendChild(collapseDiv);
        
        return collapseBody;
    }
}

// 导出UI工具类
window.UIUtils = UIUtils;