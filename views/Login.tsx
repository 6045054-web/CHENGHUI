
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Lock, Key, AlertCircle, CheckSquare, Square, ShieldAlert, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (un: string, pw: string) => Promise<User | null>;
}

const LoginView: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return setError('请先同意安全协议');
    if (!username || !password) return setError('请输入账号和密码');

    setLoading(true);
    setError(null);
    try {
      const user = await onLogin(username, password);
      if (!user) {
        setError('工号或密码错误，请核实后重试');
      }
    } catch (e: any) {
      setError(`连接失败: ${e.message || '云端服务器无响应'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </div>

      <div className="w-full max-w-sm space-y-10 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] shadow-2xl shadow-blue-500/20 flex items-center justify-center mb-6 border-4 border-slate-800/50">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter mb-1">成汇数字平台</h1>
          <p className="text-blue-400 text-[8px] font-black uppercase tracking-[3px]">Digital Supervision Platform</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl border border-slate-700 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work ID / 工号</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入工号"
                  className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password / 密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-6 py-4 bg-slate-900/50 border-2 border-slate-700 rounded-2xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 px-1">
            <button type="button" onClick={() => setAgreed(!agreed)} className={`mt-0.5 ${agreed ? 'text-blue-500' : 'text-slate-600'}`}>
              {agreed ? <CheckSquare className="w-5 h-5 fill-current" /> : <Square className="w-5 h-5" />}
            </button>
            <div className="text-[10px] text-slate-400 leading-normal font-medium">
              我已确认此设备为办公使用，并同意遵守 <button type="button" onClick={() => setShowPolicy(true)} className="text-blue-400 font-bold underline">《隐私协议》</button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-xs font-bold animate-in zoom-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4.5 rounded-2xl shadow-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Key className="w-4 h-4" /> 授权登录</>}
          </button>
        </form>

        <div className="text-center">
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[4px]">Xinjiang Chenghui Assets</p>
        </div>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-end justify-center p-0">
           <div className="bg-slate-900 w-full max-w-lg rounded-t-[40px] p-10 flex flex-col max-h-[80vh] border-t border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-500" /> 安全协议
                </h2>
                <button onClick={() => setShowPolicy(false)} className="text-slate-400">关闭</button>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-400 leading-relaxed space-y-4">
                 <p className="font-bold text-blue-400">本系统仅供新疆成汇工程管理有限公司内部员工使用。</p>
                 <p>1. 数据所有权：应用内产生的所有数据均属于公司资产，严禁私自截图转发。</p>
                 <p>2. 考勤定位：本应用仅在点击打卡时采集一次地理位置，不会持续追踪您的行踪。</p>
                 <p>3. 法律责任：所有填写的监理日志、旁站记录具有法律效力，填报人需对真实性负责。</p>
              </div>
              <button onClick={() => { setAgreed(true); setShowPolicy(false); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black mt-8">我已阅读并确认</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
