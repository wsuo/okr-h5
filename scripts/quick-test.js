/**
 * 快速测试脚本 - 不依赖 Puppeteer
 * 用于快速验证测试逻辑和配置
 */

const https = require('https');
const http = require('http');

const config = {
  baseUrl: 'http://localhost:3001',
  timeout: 5000
};

class QuickTester {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testConnection() {
    return new Promise((resolve) => {
      const url = new URL(config.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(config.baseUrl, (res) => {
        this.log(`服务器响应状态: ${res.statusCode}`, 'success');
        this.log(`响应头: ${JSON.stringify(res.headers, null, 2)}`);
        resolve(true);
      });

      req.on('error', (err) => {
        this.log(`连接失败: ${err.message}`, 'error');
        resolve(false);
      });

      req.setTimeout(config.timeout, () => {
        req.destroy();
        this.log('连接超时', 'error');
        resolve(false);
      });
    });
  }

  async checkPuppeteerInstallation() {
    try {
      require('puppeteer');
      this.log('Puppeteer 已安装', 'success');
      return true;
    } catch (error) {
      this.log('Puppeteer 未安装，请运行: npm install puppeteer', 'error');
      return false;
    }
  }

  async validateTestData() {
    const testTemplate = {
      name: '自动化测试模板',
      description: '这是一个由自动化测试创建的模板',
      type: 'okr'
    };

    this.log('验证测试数据配置:', 'info');
    this.log(`模板名称: ${testTemplate.name}`);
    this.log(`模板描述: ${testTemplate.description}`);
    this.log(`模板类型: ${testTemplate.type}`);
    
    return true;
  }

  async checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    this.log(`Node.js 版本: ${version}`);
    
    if (majorVersion >= 14) {
      this.log('Node.js 版本符合要求', 'success');
      return true;
    } else {
      this.log('Node.js 版本过低，推荐使用 14.0.0 或更高版本', 'warning');
      return false;
    }
  }

  async generateTestPlan() {
    this.log('\n🧪 生成测试计划:', 'info');
    
    const testSteps = [
      '1. 启动浏览器并配置',
      '2. 访问登录页面',
      '3. 输入管理员凭据 (admin/123456)',
      '4. 验证登录成功',
      '5. 导航到模板管理页面',
      '6. 点击新增模板按钮',
      '7. 填写模板信息表单',
      '8. 提交表单并验证成功消息',
      '9. 在列表中查找创建的模板',
      '10. 点击删除按钮',
      '11. 确认删除操作',
      '12. 验证删除成功消息',
      '13. 确认模板从列表中移除',
      '14. 生成测试报告'
    ];

    testSteps.forEach(step => {
      this.log(step);
    });

    return testSteps;
  }

  async runChecks() {
    this.log('🚀 开始快速环境检查\n', 'info');

    // 检查 Node.js 版本
    await this.checkNodeVersion();

    // 检查服务器连接
    this.log('\n🌐 检查服务器连接...', 'info');
    const connectionOk = await this.testConnection();

    // 检查 Puppeteer 安装
    this.log('\n📦 检查 Puppeteer 安装...', 'info');
    const puppeteerOk = await this.checkPuppeteerInstallation();

    // 验证测试数据
    this.log('\n📋 验证测试数据...', 'info');
    await this.validateTestData();

    // 生成测试计划
    await this.generateTestPlan();

    // 总结
    this.log('\n📊 环境检查总结:', 'info');
    this.log(`服务器连接: ${connectionOk ? '✅ 正常' : '❌ 异常'}`);
    this.log(`Puppeteer: ${puppeteerOk ? '✅ 已安装' : '❌ 未安装'}`);

    if (connectionOk && puppeteerOk) {
      this.log('\n🎉 环境检查通过！可以运行完整测试:', 'success');
      this.log('npm run test:template', 'info');
    } else {
      this.log('\n⚠️  环境存在问题，请解决后再运行测试:', 'warning');
      
      if (!connectionOk) {
        this.log('- 请确保开发服务器正在运行: npm run dev', 'warning');
      }
      
      if (!puppeteerOk) {
        this.log('- 请安装 Puppeteer: npm install puppeteer', 'warning');
      }
    }

    return {
      connection: connectionOk,
      puppeteer: puppeteerOk,
      ready: connectionOk && puppeteerOk
    };
  }
}

// 运行快速检查
async function main() {
  const tester = new QuickTester();
  const result = await tester.runChecks();
  process.exit(result.ready ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 快速检查失败:', error.message);
    process.exit(1);
  });
}

module.exports = QuickTester;