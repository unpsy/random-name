// =======================
// 全局变量和配置
// =======================
let participants = [];
let drawnWinners = [];

// =======================
// 页面加载完成后初始化
// =======================
document.addEventListener('DOMContentLoaded', function() {
    initializeSnowfall();
    initializeFileUpload();
    initializeDrawButton();
    initializeThemeSwitcher();
    initializeResultButtons();
    
    // 显示主题切换器（开发者功能）
    if (localStorage.getItem('showThemeSwitcher') === 'true') {
        document.getElementById('themeSwitcher').style.display = 'flex';
    }
});

// =======================
// 雪花飘落动画
// =======================
function initializeSnowfall() {
    const snowContainer = document.getElementById('snowContainer');
    const snowflakeCount = 50;
    
    for (let i = 0; i < snowflakeCount; i++) {
        createSnowflake(snowContainer);
    }
}

function createSnowflake(container) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = '❄';
    
    // 随机起始位置和动画参数
    const startX = Math.random() * window.innerWidth;
    const animationDuration = Math.random() * 3 + 2; // 2-5秒
    const delay = Math.random() * 2; // 0-2秒延迟
    const size = Math.random() * 0.5 + 0.5; // 0.5-1倍大小
    
    snowflake.style.left = startX + 'px';
    snowflake.style.animationDuration = animationDuration + 's';
    snowflake.style.animationDelay = delay + 's';
    snowflake.style.fontSize = size + 'em';
    
    container.appendChild(snowflake);
    
    // 动画结束后重新创建雪花
    setTimeout(() => {
        if (snowflake.parentNode) {
            snowflake.parentNode.removeChild(snowflake);
            createSnowflake(container);
        }
    }, (animationDuration + delay) * 1000);
}

// =======================
// 文件上传功能
// =======================
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const participantCount = document.getElementById('participantCount');
    
    // 点击上传
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
}

function handleFileUpload(file) {
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
        alert('请上传Excel文件(.xls或.xlsx格式)');
        return;
    }
    
    const uploadArea = document.getElementById('uploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const participantCount = document.getElementById('participantCount');
    
    // 显示上传中状态
    uploadArea.style.opacity = '0.6';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // 读取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON数据
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // 提取名单（假设第一列是姓名）
            participants = jsonData
                .map(row => row[0])
                .filter(name => name && name.toString().trim() !== '')
                .map(name => name.toString().trim());
            
            if (participants.length === 0) {
                alert('文件中没有找到有效的名单数据');
                return;
            }
            
            // 更新UI
            uploadArea.classList.add('success');
            fileInfo.style.display = 'block';
            fileName.textContent = `文件: ${file.name}`;
            participantCount.textContent = `${participants.length} 人`;
            
            // 启用抽奖按钮
            updateDrawButtonState();
            
            // 添加动画效果
            setTimeout(() => {
                uploadArea.style.opacity = '1';
            }, 300);
            
        } catch (error) {
            console.error('文件读取错误:', error);
            alert('文件读取失败，请检查文件格式是否正确');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// =======================
// 抽奖按钮功能
// =======================
function initializeDrawButton() {
    const drawButton = document.getElementById('drawButton');
    drawButton.addEventListener('click', startDraw);
}

function updateDrawButtonState() {
    const drawButton = document.getElementById('drawButton');
    const winnerCountInput = document.getElementById('winnerCount');
    const winnerCount = parseInt(winnerCountInput.value);
    
    // 检查是否有参与者
    const hasParticipants = participants.length > 0;
    
    // 检查中奖人数是否有效
    const validWinnerCount = winnerCount > 0 && winnerCount <= participants.length;
    
    drawButton.disabled = !(hasParticipants && validWinnerCount);
}

function startDraw() {
    const drawButton = document.getElementById('drawButton');
    const buttonText = drawButton.querySelector('.button-text');
    const buttonLoading = drawButton.querySelector('.button-loading');
    const winnerCount = parseInt(document.getElementById('winnerCount').value);
    
    // 显示加载状态
    drawButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'flex';
    
    // 模拟抽奖过程（清洗烟囱）
    setTimeout(() => {
        performDraw(winnerCount);
        
        // 恢复按钮状态
        buttonText.style.display = 'block';
        buttonLoading.style.display = 'none';
        drawButton.disabled = false;
    }, 2000);
}

function performDraw(winnerCount) {
    // 随机抽取中奖者
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    drawnWinners = shuffled.slice(0, winnerCount);
    
    // 显示结果
    displayResults();
    
    // 触发庆祝动画
    triggerCelebration();
}

function displayResults() {
    const resultSection = document.getElementById('resultSection');
    const winnersGrid = document.getElementById('winnersGrid');
    
    // 清空之前的结果
    winnersGrid.innerHTML = '';
    
    // 创建中奖者卡片
    drawnWinners.forEach((winner, index) => {
        const winnerCard = document.createElement('div');
        winnerCard.className = 'winner-card';
        winnerCard.style.animationDelay = `${index * 0.2}s`;
        
        winnerCard.innerHTML = `
            <div class="winner-name">${winner}</div>
            <div class="winner-number">第 ${index + 1} 名</div>
        `;
        
        winnersGrid.appendChild(winnerCard);
    });
    
    // 显示结果区域
    resultSection.style.display = 'block';
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
}

// =======================
// 庆祝动画
// =======================
function triggerCelebration() {
    const celebration = document.getElementById('celebration');
    const colors = ['#D42426', '#146B3A', '#F8B229', '#FFD700', '#FF6B6B'];
    
    // 创建五彩纸屑
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            createConfetti(celebration, colors);
        }, i * 50);
    }
}

function createConfetti(container, colors) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    const startX = Math.random() * window.innerWidth;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    
    confetti.style.left = startX + 'px';
    confetti.style.backgroundColor = color;
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';
    confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
    
    container.appendChild(confetti);
    
    // 清理元素
    setTimeout(() => {
        if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
        }
    }, 5000);
}

// =======================
// 结果区域按钮
// =======================
function initializeResultButtons() {
    const againButton = document.getElementById('againButton');
    const resetButton = document.getElementById('resetButton');
    
    againButton.addEventListener('click', () => {
        // 重新抽奖（清除之前的中奖者）
        drawnWinners = [];
        document.getElementById('resultSection').style.display = 'none';
        updateDrawButtonState();
    });
    
    resetButton.addEventListener('click', resetAll);
}

function resetAll() {
    // 清除所有数据
    participants = [];
    drawnWinners = [];
    
    // 重置UI
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('uploadArea').classList.remove('success');
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('winnerCount').value = '1';
    
    // 禁用抽奖按钮
    updateDrawButtonState();
}

// =======================
// 中奖人数输入监听
// =======================
document.getElementById('winnerCount').addEventListener('input', updateDrawButtonState);

// =======================
// 主题切换功能
// =======================
function initializeThemeSwitcher() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            switchTheme(theme);
        });
    });
    
    // 从localStorage加载主题
    const savedTheme = localStorage.getItem('selectedTheme') || 'christmas';
    switchTheme(savedTheme);
}

function switchTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selectedTheme', theme);
    
    // 更新按钮状态
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });
}

// =======================
// 开发者功能
// =======================
// 在控制台输入 toggleThemeSwitcher() 来显示/隐藏主题切换器
window.toggleThemeSwitcher = function() {
    const switcher = document.getElementById('themeSwitcher');
    const currentDisplay = switcher.style.display;
    const newDisplay = currentDisplay === 'none' ? 'flex' : 'none';
    
    switcher.style.display = newDisplay;
    localStorage.setItem('showThemeSwitcher', newDisplay === 'flex');
    
    console.log('主题切换器已', newDisplay === 'flex' ? '显示' : '隐藏');
};

// =======================
// 工具函数
// =======================
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRandomElements(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
}

// =======================
// 错误处理
// =======================
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
});

// =======================
// 性能优化
// =======================
// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// =======================
// 导出函数（用于测试）
// =======================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        shuffleArray,
        getRandomElements,
        performDraw,
        switchTheme
    };
}