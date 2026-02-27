/**
 * 京东竞品分析助手 - 内容脚本
 *
 * 作用：
 * 1. 在京东商品详情页提取商品数据。
 * 2. 响应 popup.js 的消息请求，把数据返回给弹窗。
 *
 * 说明：
 * 京东页面会根据活动、版式、AB 实验变化 DOM 结构，
 * 所以下面使用“多个选择器兜底”的方式，提高兼容性。
 */

/**
 * 工具函数：依次尝试多个选择器，返回第一个命中的文本。
 * @param {string[]} selectors - CSS 选择器列表
 * @returns {string} 命中的文本，若都未命中则返回“未找到”
 */
function pickText(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (node) {
      const value = (node.textContent || '').trim();
      if (value) {
        return value;
      }
    }
  }
  return '未找到';
}

/**
 * 工具函数：从字符串中提取数字（包含小数），用于清理价格与评论数。
 * @param {string} text
 * @returns {string}
 */
function extractNumber(text) {
  if (!text) return '未找到';
  const matches = text.replace(/,/g, '').match(/\d+(\.\d+)?/g);
  return matches ? matches.join('') : '未找到';
}

/**
 * 判断当前页面是否像“京东商品详情页”。
 * 常见链接：https://item.jd.com/123456.html
 */
function isJdProductPage() {
  return /item\.jd\.com\/\d+\.html/.test(location.href);
}

/**
 * 抓取商品详情数据。
 * @returns {{title:string, price:string, rating:string, comments:string, url:string, timestamp:string, isProductPage:boolean}}
 */
function collectProductData() {
  const title = pickText([
    '.sku-name',
    '.itemInfo-wrap .sku-name',
    '.p-name h1'
  ]);

  // 价格在京东里常见于 .price J_price，也可能在活动价模块中。
  const rawPrice = pickText([
    '.summary-price .p-price .price',
    '.summary-price .p-price span',
    '.p-price .price',
    '.J-p-123456',
    '.price'
  ]);

  // 评分常见位置：.percent-con（好评率）或评论区评分数字。
  const rating = pickText([
    '.comment-info .percent-con',
    '.comment-info .score',
    '.f-s-1',
    '.tag-list .percent'
  ]);

  // 评论总数常见位置：#comment-count / .J-comment-count
  const rawComments = pickText([
    '#comment-count .count',
    '#comment-count',
    '.J-comment-count',
    '.comment-item .count'
  ]);

  const normalizedTitle = title === '未找到' ? document.title.replace(/【.*?】/g, '').trim() || '未找到' : title;

  return {
    title: normalizedTitle,
    price: rawPrice === '未找到' ? '未找到' : `¥${extractNumber(rawPrice)}`,
    rating,
    comments: rawComments === '未找到' ? '未找到' : extractNumber(rawComments),
    url: location.href,
    timestamp: new Date().toLocaleString(),
    isProductPage: isJdProductPage()
  };
}

// 监听 popup 发送的消息。
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'GET_JD_PRODUCT_DATA') {
    sendResponse(collectProductData());
  }
});
