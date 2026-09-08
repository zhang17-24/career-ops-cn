// Verified by clicking Tencent's public job list. Repair only the known old
// adapter route; preserve IDs as strings and leave unrelated URLs untouched.
export function tencentJobUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== 'join.qq.com' || url.pathname !== '/jobdesc.html') return value;
    const id = url.searchParams.get('postId');
    if (!id || !/^\d+$/.test(id)) return value;
    url.pathname = '/post_detail.html';
    url.searchParams.delete('postId');
    url.searchParams.set('postid', id);
    return url.href;
  } catch { return value; }
}
