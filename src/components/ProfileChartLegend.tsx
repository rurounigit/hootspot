// src/components/ProfileChartLegend.tsx

import React from 'react';

const CATEGORIES = [
  { name: 'Interpersonal & Psychological', color: '#8884d8' },
  { name: 'Covert & Indirect Control', color: '#82ca9d' },
  { name: 'Sociopolitical & Rhetorical', color: '#ffc658' },
  { name: 'No Findings in Category', color: '#22c55e' },
];

const ProfileChartLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-600">
      {CATEGORIES.map(cat => (
        <div key={cat.name} className="flex items-center">
          <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: cat.color }}></span>
          <span>{cat.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ProfileChartLegend;