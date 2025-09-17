#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 发布脚本 - 自动版本增量、打包和发布提示
 */
function release() {
  try {
    console.log('🚀 开始发布流程...\n');

    // 1. 读取并更新 package.json 版本
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    // 获取当前版本并增量
    const currentVersion = packageJson.version;
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++; // 增加修订号
    const newVersion = versionParts.join('.');

    console.log(`📝 版本升级: ${currentVersion} → ${newVersion}`);

    // 更新版本号
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log('✅ package.json 版本已更新\n');

    // 2. 运行打包命令
    console.log('📦 开始打包...');
    try {
      execSync('npm run package', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      console.log('✅ 编译检查完成\n');
    } catch (error) {
      console.error('❌ 编译失败，请修复错误后重试');
      process.exit(1);
    }

    // 3. 执行 vsce package
    console.log('📦 执行 vsce package...');
    try {
      execSync('vsce package', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      console.log('✅ 打包完成\n');
    } catch (error) {
      console.error('❌ vsce package 失败');
      process.exit(1);
    }

    // 4. 输出发布信息
    console.log('🎉 发布准备完成！');
    console.log('📋 下一步操作：');
    console.log('   1. 检查生成的 .vsix 文件');
    console.log('   2. 打开发布管理页面进行发布：');
    console.log('   🔗 https://marketplace.visualstudio.com/manage/publishers/demonduyu');
    console.log('');
    console.log(`📦 新版本: ${newVersion}`);
    console.log('');
    console.log('   🔗 https://marketplace.visualstudio.com/items?itemName=demonduyu.vscode-html-editor');

  } catch (error) {
    console.error('❌ 发布流程失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本则执行发布流程
if (require.main === module) {
  release();
}

module.exports = release;