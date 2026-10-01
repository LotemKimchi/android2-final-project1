import { Group } from '../models/Group.js';
import { Post } from '../models/Post.js';
import { addUtcMonths, startOfUtcMonth, utcMonthKey } from '../utils/dates.js';

export async function countPostsPerMonth(months, now = new Date()) {
  const start = addUtcMonths(startOfUtcMonth(now), -(months - 1));
  const rows = await Post.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const countByMonth = new Map(
    rows.map(({ _id, count }) => [`${_id.year}-${String(_id.month).padStart(2, '0')}`, count]),
  );
  return Array.from({ length: months }, (_, index) => {
    const month = utcMonthKey(addUtcMonths(start, index));
    return { month, count: countByMonth.get(month) ?? 0 };
  });
}

export function topGroupsByMembers(limit) {
  return Group.aggregate([
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        name: 1,
        privacy: 1,
        memberCount: { $size: '$members' },
      },
    },
    { $sort: { memberCount: -1, name: 1 } },
    { $limit: limit },
  ]);
}
