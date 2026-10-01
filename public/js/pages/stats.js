import { renderHorizontalBarChart } from '../charts/barChart.js';
import { renderLineChart } from '../charts/lineChart.js';
import { api } from '../lib/api.js';
import { escapeHtml } from '../lib/ui.js';

const lineContainer = document.getElementById('posts-per-month-chart');
const barContainer = document.getElementById('members-per-group-chart');
const $months = $('#months-select');
const cache = { postsPerMonth: null, membersPerGroup: null };

const MONTH_FORMAT = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const formatMonth = (key) => MONTH_FORMAT.format(new Date(`${key}-01T00:00:00Z`));

function showError(container, error) {
  $(container).html(`<p class="error">${escapeHtml(error.message)}</p>`);
}

function drawPostsPerMonth() {
  if (!cache.postsPerMonth) return;
  renderLineChart(lineContainer, cache.postsPerMonth, {
    x: (d) => d.month,
    y: (d) => d.count,
    formatX: formatMonth,
    label: 'Number of posts per month',
  });
}

function drawMembersPerGroup() {
  if (!cache.membersPerGroup) return;
  renderHorizontalBarChart(barContainer, cache.membersPerGroup, {
    label: (d) => d.name,
    value: (d) => d.memberCount,
    unit: 'members',
    ariaLabel: 'Groups ranked by number of members',
  });
}

async function loadPostsPerMonth() {
  try {
    const { items } = await api.get('/api/stats/posts-per-month', { months: $months.val() });
    cache.postsPerMonth = items;
    drawPostsPerMonth();
  } catch (error) {
    showError(lineContainer, error);
  }
}

async function loadMembersPerGroup() {
  try {
    const { items } = await api.get('/api/stats/members-per-group', { limit: 10 });
    cache.membersPerGroup = items;
    drawMembersPerGroup();
  } catch (error) {
    showError(barContainer, error);
  }
}

let resizeTimer = null;
$(window).on('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawPostsPerMonth();
    drawMembersPerGroup();
  }, 200);
});

$months.on('change', loadPostsPerMonth);

loadPostsPerMonth();
loadMembersPerGroup();
