import React from 'react';
import { Announcement } from '../types';
import { Bell, Calendar, User } from 'lucide-react';

interface AnnouncementsProps {
  announcements: Announcement[];
}

const AnnouncementsView: React.FC<AnnouncementsProps> = ({ announcements }) => {
  // 对所有公告进行降序排序，确保最新发布的显示在最上方
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const dateDiff = new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id); // 日期相同时按 ID 降序
  });

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">公司公告</h2>
      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-10" />
            <p className="text-sm font-bold">暂无公告内容</p>
          </div>
        ) : (
          sortedAnnouncements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                    <Calendar className="w-3 h-3" />
                    {ann.publishDate}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                    <User className="w-3 h-3" />
                    {ann.author || '管理总部'}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{ann.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{ann.content}</p>
              </div>
              
              {ann.images && ann.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {ann.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`ann-img-${idx}`} 
                      className="w-full h-32 object-cover rounded-xl border border-slate-100"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsView;