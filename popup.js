/**
 * 京东竞品分析助手 - Popup 脚本
 *
 * 作用：
 * 1. 点击按钮时获取当前激活标签页。
 * 2. 向内容脚本发送消息，请它抓取商品信息。
 * 3. 将结果渲染到弹窗页面。
 */

const titleEl = document.getElementById('title');
const priceEl = document.getElementById('price');
const ratingEl = document.getElementById('rating');
const commentsEl = document.getElementById('comments');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');

/**
 * 设置状态文本
 * @param {string} text
 */
function setStatus(text) {
  statusEl.textContent = text;
}

/**
 * 渲染抓取结果
 * @param {{title:string, price:string, rating:string, comments:string, url:string, timestamp:string, isProductPage:boolean}} data
 */
function renderData(data) {
  titleEl.textContent = data.title || '未找到';
  priceEl.textContent = data.price || '未找到';
  ratingEl.textContent = data.rating || '未找到';
  commentsEl.textContent = data.comments || '未找到';

  if (!data.isProductPage) {
    setStatus('当前页面不是标准京东商品详情页（item.jd.com/...），数据可能不完整。');
  } else {
    setStatus(`最近更新：${data.timestamp}`);
  }
}

/**
 * 获取当前活动标签页
 * @returns {Promise<chrome.tabs.Tab>}
 */
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

/**
 * 读取商品数据
 */
async function fetchProductData() {
  try {
    setStatus('正在抓取数据，请稍候...');

    const tab = await getCurrentTab();
    if (!tab || !tab.id || !tab.url) {
      setStatus('无法获取当前标签页。');
      return;
    }

    if (!tab.url.includes('jd.com')) {
      setStatus('请先打开京东商品页面（jd.com）再使用。');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_JD_PRODUCT_DATA'
    });

    if (!response) {
      setStatus('未获取到数据。请刷新商品页面后重试。');
      return;
    }

    renderData(response);
  } catch (error) {
    console.error('抓取失败：', error);
    setStatus('抓取失败：请确认页面已完全加载，或刷新后重试。');
  }
}

refreshBtn.addEventListener('click', fetchProductData);

// 弹窗打开时自动尝试抓取一次，减少手动操作。
fetchProductData();
