/**
 * 模板管理模块自动化测试脚本
 * 测试新增和删除模板功能
 */

const puppeteer = require('puppeteer');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  credentials: {
    username: 'admin',
    password: '123456'
  },
  testTemplate: {
    name: '自动化测试模板',
    description: '这是一个由自动化测试创建的模板',
    type: 'okr'
  },
  timeout: 30000,
  slowMo: 100 // 减慢操作速度便于观察
};

class TemplateTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  // 初始化浏览器和页面
  async setup() {
    console.log('🚀 启动浏览器...');
    this.browser = await puppeteer.launch({
      headless: false, // 设置为 true 可在后台运行
      slowMo: config.slowMo,
      devtools: false,
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    this.page = await this.browser.newPage();
    
    // 设置超时时间
    this.page.setDefaultTimeout(config.timeout);
    
    // 监听控制台日志
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 页面错误:', msg.text());
      }
    });

    // 监听页面错误
    this.page.on('pageerror', error => {
      console.log('❌ JavaScript 错误:', error.message);
    });
  }

  // 清理资源
  async cleanup() {
    if (this.browser) {
      console.log('🧹 关闭浏览器...');
      await this.browser.close();
    }
  }

  // 记录测试结果
  logResult(testName, success, message = '') {
    const result = {
      test: testName,
      success,
      message,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  // 等待元素出现
  async waitForSelector(selector, options = {}) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000, ...options });
      return true;
    } catch (error) {
      console.log(`⚠️  等待元素失败: ${selector}`);
      return false;
    }
  }

  // 等待并点击元素
  async clickElement(selector, description = '') {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.click(selector);
      console.log(`🖱️  点击 ${description || selector}`);
      return true;
    } catch (error) {
      console.log(`❌ 点击失败 ${description || selector}:`, error.message);
      return false;
    }
  }

  // 输入文本
  async typeText(selector, text, description = '') {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.click(selector); // 先点击获取焦点
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.type(selector, text);
      console.log(`⌨️  输入 ${description || selector}: ${text}`);
      return true;
    } catch (error) {
      console.log(`❌ 输入失败 ${description || selector}:`, error.message);
      return false;
    }
  }

  // 等待 Toast 消息
  async waitForToast(expectedMessage = '', timeout = 5000) {
    try {
      // 等待 toast 出现
      await this.page.waitForSelector('[data-sonner-toast]', { timeout });
      
      // 获取 toast 文本内容
      const toastText = await this.page.evaluate(() => {
        const toast = document.querySelector('[data-sonner-toast]');
        return toast ? toast.textContent.trim() : '';
      });

      console.log(`🔔 Toast 消息: ${toastText}`);
      
      if (expectedMessage && !toastText.includes(expectedMessage)) {
        return { success: false, message: `期望包含 "${expectedMessage}"，实际为 "${toastText}"` };
      }
      
      return { success: true, message: toastText };
    } catch (error) {
      return { success: false, message: '未检测到 Toast 消息' };
    }
  }

  // 登录系统
  async login() {
    console.log('\n📝 开始登录测试...');
    
    try {
      await this.page.goto(config.baseUrl);
      
      // 等待登录表单
      const loginFormExists = await this.waitForSelector('form');
      if (!loginFormExists) {
        this.logResult('登录页面加载', false, '登录表单未找到');
        return false;
      }

      // 输入用户名
      const usernameInput = await this.typeText(
        'input[name="username"], input[placeholder*="用户名"], input[id*="username"]',
        config.credentials.username,
        '用户名'
      );
      
      // 输入密码
      const passwordInput = await this.typeText(
        'input[name="password"], input[type="password"], input[placeholder*="密码"]',
        config.credentials.password,
        '密码'
      );

      if (!usernameInput || !passwordInput) {
        this.logResult('登录表单填写', false, '无法找到用户名或密码输入框');
        return false;
      }

      // 点击登录按钮
      const loginClicked = await this.clickElement(
        'button[type="submit"], button:contains("登录"), button:contains("登入")',
        '登录按钮'
      );

      if (!loginClicked) {
        this.logResult('点击登录按钮', false, '无法找到登录按钮');
        return false;
      }

      // 等待页面跳转
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
      
      // 检查是否登录成功（检查是否跳转到管理界面）
      const currentUrl = this.page.url();
      const loginSuccess = currentUrl.includes('/admin') || currentUrl !== config.baseUrl;
      
      this.logResult('用户登录', loginSuccess, loginSuccess ? '登录成功' : '登录失败');
      return loginSuccess;

    } catch (error) {
      this.logResult('用户登录', false, `登录过程出错: ${error.message}`);
      return false;
    }
  }

  // 导航到模板管理页面
  async navigateToTemplateManagement() {
    console.log('\n📂 导航到模板管理页面...');
    
    try {
      // 检查当前是否已在管理页面
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/admin')) {
        await this.page.goto(`${config.baseUrl}/admin`);
        await this.page.waitForLoadState('networkidle');
      }

      // 查找模板管理相关的标题或标识
      const templateManagementExists = await this.waitForSelector(
        'h1:contains("模板管理"), h2:contains("模板管理"), [data-testid="template-management"], .template-management'
      );

      this.logResult('导航到模板管理', templateManagementExists, 
        templateManagementExists ? '成功进入模板管理页面' : '未找到模板管理页面');
      
      return templateManagementExists;
    } catch (error) {
      this.logResult('导航到模板管理', false, `导航失败: ${error.message}`);
      return false;
    }
  }

  // 测试新增模板功能
  async testCreateTemplate() {
    console.log('\n➕ 测试新增模板功能...');
    
    try {
      // 点击新增模板按钮
      const addButtonClicked = await this.clickElement(
        'button:contains("添加"), button:contains("新增"), button:contains("创建"), button[data-testid="add-template"]',
        '新增模板按钮'
      );

      if (!addButtonClicked) {
        this.logResult('点击新增按钮', false, '未找到新增模板按钮');
        return false;
      }

      // 等待弹窗出现
      const dialogExists = await this.waitForSelector('[role="dialog"], .dialog, [data-testid="create-dialog"]');
      if (!dialogExists) {
        this.logResult('新增弹窗显示', false, '新增模板弹窗未出现');
        return false;
      }

      this.logResult('新增弹窗显示', true, '新增模板弹窗已出现');

      // 填写模板名称
      const nameInput = await this.typeText(
        'input[name="name"], input[placeholder*="名称"], input[id*="name"]',
        config.testTemplate.name,
        '模板名称'
      );

      // 填写模板描述
      const descInput = await this.typeText(
        'textarea[name="description"], textarea[placeholder*="描述"], input[name="description"]',
        config.testTemplate.description,
        '模板描述'
      );

      if (!nameInput) {
        this.logResult('填写模板信息', false, '无法填写模板名称');
        return false;
      }

      // 选择模板类型（如果有的话）
      try {
        const typeSelector = await this.page.$('select[name="type"], [data-testid="template-type"]');
        if (typeSelector) {
          await this.page.select('select[name="type"]', config.testTemplate.type);
          console.log(`🔽 选择模板类型: ${config.testTemplate.type}`);
        }
      } catch (error) {
        console.log('⚠️  模板类型选择器未找到，跳过此步骤');
      }

      // 点击确认/创建按钮
      const submitClicked = await this.clickElement(
        'button[type="submit"], button:contains("创建"), button:contains("确认"), button:contains("保存")',
        '创建按钮'
      );

      if (!submitClicked) {
        this.logResult('点击创建按钮', false, '未找到创建按钮');
        return false;
      }

      // 等待 Toast 成功消息
      const toastResult = await this.waitForToast('创建成功');
      if (!toastResult.success) {
        this.logResult('创建成功提示', false, toastResult.message);
        return false;
      }

      this.logResult('模板创建', true, `模板 "${config.testTemplate.name}" 创建成功`);
      
      // 等待弹窗关闭
      await this.page.waitForTimeout(2000);
      
      return true;

    } catch (error) {
      this.logResult('模板创建', false, `创建过程出错: ${error.message}`);
      return false;
    }
  }

  // 查找刚创建的模板
  async findCreatedTemplate() {
    console.log('\n🔍 查找刚创建的模板...');
    
    try {
      // 等待页面更新
      await this.page.waitForTimeout(1000);
      
      // 查找包含测试模板名称的元素
      const templateExists = await this.page.evaluate((templateName) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && 
          el.textContent.includes(templateName) &&
          el.tagName !== 'SCRIPT' &&
          el.tagName !== 'STYLE'
        );
      }, config.testTemplate.name);

      this.logResult('查找创建的模板', templateExists, 
        templateExists ? '找到刚创建的模板' : '未找到刚创建的模板');
      
      return templateExists;
    } catch (error) {
      this.logResult('查找创建的模板', false, `查找过程出错: ${error.message}`);
      return false;
    }
  }

  // 测试删除模板功能
  async testDeleteTemplate() {
    console.log('\n🗑️  测试删除模板功能...');
    
    try {
      // 查找删除按钮（通常在模板行内）
      const deleteButtonExists = await this.page.evaluate((templateName) => {
        // 首先找到包含模板名称的行或容器
        const elements = Array.from(document.querySelectorAll('*'));
        const templateContainer = elements.find(el => 
          el.textContent && 
          el.textContent.includes(templateName) &&
          el.tagName !== 'SCRIPT' &&
          el.tagName !== 'STYLE'
        );

        if (templateContainer) {
          // 在该容器或其父容器中查找删除按钮
          let parent = templateContainer;
          for (let i = 0; i < 5; i++) { // 向上查找5层
            if (!parent) break;
            
            const deleteButton = parent.querySelector(
              'button:contains("删除"), [data-testid="delete-button"], button[title*="删除"], .delete-button, button .trash'
            ) || Array.from(parent.querySelectorAll('button')).find(btn => 
              btn.textContent.includes('删除') || 
              btn.querySelector('.trash, [data-icon="trash"]')
            );
            
            if (deleteButton) {
              deleteButton.scrollIntoView();
              deleteButton.click();
              return true;
            }
            parent = parent.parentElement;
          }
        }
        return false;
      }, config.testTemplate.name);

      if (!deleteButtonExists) {
        // 备选方案：查找所有删除按钮，点击最后一个（通常是最新创建的）
        const deleteButtons = await this.page.$$('button:contains("删除"), [aria-label*="删除"], button[title*="删除"]');
        if (deleteButtons.length > 0) {
          await deleteButtons[deleteButtons.length - 1].click();
          console.log('🖱️  点击删除按钮（备选方案）');
        } else {
          this.logResult('点击删除按钮', false, '未找到删除按钮');
          return false;
        }
      } else {
        console.log('🖱️  点击删除按钮');
      }

      // 等待确认弹窗出现
      const confirmDialogExists = await this.waitForSelector(
        '[role="alertdialog"], .alert-dialog, [data-testid="delete-confirm"]'
      );

      if (confirmDialogExists) {
        this.logResult('删除确认弹窗', true, '删除确认弹窗已出现');
        
        // 点击确认删除按钮
        const confirmClicked = await this.clickElement(
          'button:contains("删除"), button:contains("确认"), [data-testid="confirm-delete"]',
          '确认删除按钮'
        );

        if (!confirmClicked) {
          this.logResult('确认删除', false, '未找到确认删除按钮');
          return false;
        }
      } else {
        console.log('⚠️  未出现确认弹窗，可能直接删除');
      }

      // 等待删除成功的 Toast 消息
      const toastResult = await this.waitForToast('删除成功');
      if (!toastResult.success) {
        this.logResult('删除成功提示', false, toastResult.message);
        return false;
      }

      this.logResult('模板删除', true, `模板 "${config.testTemplate.name}" 删除成功`);
      return true;

    } catch (error) {
      this.logResult('模板删除', false, `删除过程出错: ${error.message}`);
      return false;
    }
  }

  // 验证模板已被删除
  async verifyTemplateDeleted() {
    console.log('\n✔️  验证模板已被删除...');
    
    try {
      // 等待页面更新
      await this.page.waitForTimeout(2000);
      
      // 检查模板是否还存在
      const templateStillExists = await this.page.evaluate((templateName) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => 
          el.textContent && 
          el.textContent.includes(templateName) &&
          el.tagName !== 'SCRIPT' &&
          el.tagName !== 'STYLE'
        );
      }, config.testTemplate.name);

      const deleted = !templateStillExists;
      this.logResult('验证模板删除', deleted, 
        deleted ? '模板已成功删除' : '模板仍然存在');
      
      return deleted;
    } catch (error) {
      this.logResult('验证模板删除', false, `验证过程出错: ${error.message}`);
      return false;
    }
  }

  // 运行完整测试套件
  async runTests() {
    console.log('🧪 开始模板管理模块自动化测试\n');
    
    try {
      await this.setup();
      
      // 执行测试步骤
      const loginSuccess = await this.login();
      if (!loginSuccess) return this.generateReport();

      const navigationSuccess = await this.navigateToTemplateManagement();
      if (!navigationSuccess) return this.generateReport();

      const createSuccess = await this.testCreateTemplate();
      if (!createSuccess) return this.generateReport();

      await this.findCreatedTemplate();

      const deleteSuccess = await this.testDeleteTemplate();
      if (deleteSuccess) {
        await this.verifyTemplateDeleted();
      }

      return this.generateReport();

    } catch (error) {
      console.log('❌ 测试过程中发生错误:', error.message);
      this.logResult('测试执行', false, error.message);
      return this.generateReport();
    } finally {
      await this.cleanup();
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(failedTests === 0 ? '🎉 所有测试通过！' : '⚠️  部分测试失败');
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.testResults
    };
  }
}

// 运行测试
async function main() {
  const testSuite = new TemplateTestSuite();
  const results = await testSuite.runTests();
  
  // 如果需要，可以将结果保存到文件
  // const fs = require('fs');
  // fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.log('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  main();
}

module.exports = TemplateTestSuite;