/**
 * 轻量版模板管理测试脚本
 * 使用系统已安装的 Chrome 浏览器，不需要下载 Chromium
 */

const puppeteer = require('puppeteer-core');
const os = require('os');
const fs = require('fs');

// 获取系统 Chrome 路径
function getChromePath() {
  const platform = os.platform();
  
  const chromePaths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser'
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ],
    linux: [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ]
  };

  const paths = chromePaths[platform] || chromePaths.linux;
  
  for (const path of paths) {
    if (fs.existsSync(path)) {
      console.log(`🔍 找到 Chrome: ${path}`);
      return path;
    }
  }
  
  throw new Error('未找到 Chrome 浏览器，请安装 Google Chrome 或 Chromium');
}

// 测试配置
const config = {
  baseUrl: 'http://localhost:3001',
  credentials: {
    username: 'admin',
    password: '123456'
  },
  testTemplate: {
    name: '轻量版测试模板',
    description: '使用系统 Chrome 创建的测试模板',
    type: 'okr'
  },
  timeout: 30000,
  slowMo: 100
};

class LightweightTemplateTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 启动轻量版测试...');
    
    try {
      const executablePath = getChromePath();
      
      this.browser = await puppeteer.launch({
        executablePath, // 使用系统 Chrome
        headless: false,
        slowMo: config.slowMo,
        defaultViewport: {
          width: 1920,
          height: 1080
        },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });

      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(config.timeout);
      
      console.log('✅ 浏览器启动成功');
      return true;
    } catch (error) {
      console.log('❌ 浏览器启动失败:', error.message);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      console.log('🧹 关闭浏览器...');
      await this.browser.close();
    }
  }

  logResult(testName, success, message = '') {
    const result = { test: testName, success, message, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  async quickTest() {
    console.log('\n🧪 开始快速模板测试...');
    
    try {
      // 访问首页
      await this.page.goto(config.baseUrl);
      console.log('📱 页面加载完成');
      
      // 截图记录
      await this.page.screenshot({ path: 'test-screenshot.png', fullPage: true });
      console.log('📸 已保存截图: test-screenshot.png');
      
      // 获取页面标题
      const title = await this.page.title();
      console.log(`📄 页面标题: ${title}`);
      
      // 检查是否有登录表单
      const hasLoginForm = await this.page.$('input[type="password"]') !== null;
      console.log(`🔐 登录表单: ${hasLoginForm ? '存在' : '不存在'}`);
      
      // 检查页面内容
      const bodyText = await this.page.evaluate(() => document.body.textContent);
      const hasTemplateText = bodyText.includes('模板') || bodyText.includes('template');
      console.log(`📋 模板相关内容: ${hasTemplateText ? '找到' : '未找到'}`);
      
      this.logResult('页面访问测试', true, '成功访问应用首页');
      this.logResult('页面内容检查', hasTemplateText, hasTemplateText ? '发现模板相关内容' : '未发现模板相关内容');
      
      return true;
    } catch (error) {
      this.logResult('快速测试', false, `测试失败: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${totalTests ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: totalTests ? (passedTests / totalTests) * 100 : 0,
      results: this.testResults
    };
  }

  async run() {
    try {
      const setupSuccess = await this.setup();
      if (!setupSuccess) {
        return this.generateReport();
      }

      await this.quickTest();
      
      return this.generateReport();
    } catch (error) {
      console.log('❌ 测试执行失败:', error.message);
      this.logResult('测试执行', false, error.message);
      return this.generateReport();
    } finally {
      await this.cleanup();
    }
  }
}

// 运行测试
async function main() {
  console.log('🌟 轻量版 Puppeteer 测试');
  console.log('使用系统安装的 Chrome 浏览器\n');
  
  const tester = new LightweightTemplateTest();
  const results = await tester.run();
  
  console.log('\n💡 提示:');
  console.log('- 这是轻量版测试，仅验证基本功能');
  console.log('- 如需完整测试，请安装完整版 Puppeteer');
  console.log('- 截图已保存为 test-screenshot.png');
  
  process.exit(results.failed === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 轻量版测试失败:', error.message);
    process.exit(1);
  });
}

module.exports = LightweightTemplateTest;