
const SUPABASE_URL = 'https://mycbjreiocjdggpwiwhq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bmvPaiUa3JU4ATdUmeHoAQ_MZofmTSD';

export const dbService = {
  async request(table: string, method: string = 'GET', body?: any, query: string = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    
    const headers: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal' // 提高性能，成功时不返回数据内容
    };

    // 如果是 POST 且包含 ID，执行 upsert (插入或更新)
    if (method === 'POST' && body && body.id) {
      headers['Prefer'] = 'return=minimal,resolution=merge-duplicates';
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
          const errText = await response.text();
          console.error(`Supabase Error [${response.status}]:`, errText);
          throw new Error(`云端服务异常: ${response.status}`);
      }
      
      // 读取响应体文本
      const text = await response.text();
      
      // 如果响应体为空（return=minimal 或 204 No Content），直接返回成功
      if (!text || response.status === 204) {
        return true;
      }
      
      // 尝试解析 JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        // 如果不是 JSON 但有内容，则返回原始文本
        return text;
      }
    } catch (error) {
      console.error("Network Request Failed:", error);
      throw error;
    }
  },

  async login(un: string, pw: string) {
    // 登录需要返回用户信息，所以不能用默认的 return=minimal
    const url = `${SUPABASE_URL}/rest/v1/users?username=eq.${un}&password=eq.${pw}&select=*`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  },

  async fetchAllData() {
    try {
      // 获取数据时明确不使用 return=minimal
      const fetchWithData = async (table: string, query: string = '') => {
        const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        return res.ok ? await res.json() : [];
      };

      const [reports, announcements, projects, users, attendance] = await Promise.all([
        fetchWithData('reports', '?order=date.desc'),
        fetchWithData('announcements', '?order=publishDate.desc'),
        fetchWithData('projects'),
        fetchWithData('users'),
        fetchWithData('attendance', '?order=time.desc&limit=200')
      ]);

      return { 
        reports: reports || [], 
        announcements: announcements || [], 
        projects: projects || [], 
        users: users || [], 
        attendance: attendance || [] 
      };
    } catch (e) {
      console.error("Fetch All Data Error:", e);
      return { reports: [], announcements: [], projects: [], users: [], attendance: [] };
    }
  },

  async saveReport(r: any) { 
    return this.request('reports', 'POST', r); 
  },
  
  async saveAttendance(a: any) { 
    return this.request('attendance', 'POST', a); 
  },
  
  async saveUser(u: any) { 
    return this.request('users', 'POST', u); 
  },
  
  async saveProject(p: any) { 
    return this.request('projects', 'POST', p); 
  },
  
  async saveAnnouncement(n: any) { 
    return this.request('announcements', 'POST', n); 
  },

  async deleteProject(id: string) { 
    return this.request('projects', 'DELETE', null, `?id=eq.${id}`); 
  },
  
  async deleteUser(id: string) { 
    return this.request('users', 'DELETE', null, `?id=eq.${id}`); 
  },

  async deleteAnnouncement(id: string) {
    return this.request('announcements', 'DELETE', null, `?id=eq.${id}`);
  }
};
