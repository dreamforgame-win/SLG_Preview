import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, Minus, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface Tab {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_TABS: Tab[] = [
  { 
    id: '1', 
    name: '宏观战场', 
    content: `- 宏观战场
  - 移除铺路机制
    - 城与城之间无需通过铺路连接
    - 增加城市密度，从铺路转变为更频繁的打城
    - 当占领城市后，即可连通到下一座城
      - 可以设定无成本或有成本
        - 无成本则直接连通与之关联的城市，可以继续往下推
        - 有成本则需要盟主消耗联盟资源进行道路开拓（即时间成本+资源成本）
          - 开拓可以【职业】加速，对应职业成员派兵集合即可加速开拓
      - 或者增加连通收益
        - 连通后玩家在区域内的行军速度得到提升` 
  },
  {
    id: '2',
    name: '战斗机制',
    content: `- 战斗怎么打
  - 联盟之间的战斗在三谋基础之上丰富建筑类型，共分为3类型
    - 阻挡型（高血量）
    - 攻击型（中血量中攻击）
    - 陷阱类（消耗型高攻击）
    - 这个设定旨在把地形构筑加入到战斗之中，把沙盒主动权交给玩家
      - 涉及两个维度
        - 联盟发起
          - 大型军事建筑
          - 小型建筑，种类多且量大
        - 个人发起
          - 小型建筑，数量较少
      - 由联盟发起后，需要成员配合援建加速，让对应职业和普通玩家有更多的
  - 城市和玩家在战役中起什么作用：城市集群式的网状对冲
    - 设定不同等级的城市能够连通一定数量的与之相邻的城市
      - 等级越高，能够连通的层级和每层可以连通的数量越多
        - 1-3级能够连通1层，每层最多2个城市
        - 2-6级能够连通2层，每层最多3个城市
        - ……
      - 这些城市将为其提供援助和收益，比如城市预备兵恢复越快，城市耐久加成等
    - 城市加成激活则需要玩家主城提供，区域内的玩家主城越多，城市加成越高
      - 要求玩家主城根据战役调整，形成主力在前，成员在后的布局，但是大家都会依托在城市脉络里面，形成抱团的趋势

![图片描述](https://gd-hbimg-edge.huaban.com/21e5698a6ba337b78b95f01e9dd4068fb8540f741935b-kHCCN0?auth_key=1772683200-8be56e16f3b941f9bf734d01c3cf88d1-0-311b78848f36d756d92bf9241a89b91b)`
  },
  {
    id: '3',
    name: '职业系统',
    content: `- 职业的用途：设定3种大类的职业
  - 战斗类（战斗硬刚，大佬专属）。
    - 擅长进攻的职业。
    - 擅长防守的职业。
  - 建造类
    - 建造战事类建筑的职业。
    - 建造发展类建筑的职业。
  - 支援类
    - 提供各种资源支持，比如运粮，发电。
  - 增加地形之间的策略
    - 加入Y轴地形
      - 高地
      - 盆地
      - 峡谷`
  },
  {
    id: '4',
    name: '战斗布阵',
    content: `  - 格子式布阵，真实的排兵布阵的感受（主打）
    - 更为具象化
    - 兵种增加攻击距离
      - 盾兵（1）
      - 枪兵（2）
      - 弓兵（3）
    - 技能类型有着更加明显的区分
      - 被动类
      - 主动类
      - 追击类
      - 反击类
      - 光环类（指挥）
    - 不同地形随机不同的战场障碍
      - 公共战场（障碍对双方生效）
        - 水域
        - 沙地
        - 草地
      - 己方建筑可以预设障碍陷阱，敌方进攻时生效
    - 己方防守时可以在地块上设置战场障碍
    - 阵法的选择也更为直观的展示到阵列之中，对于哪些位置有加成，有什么类型的加成都有着更为直观的展示
    - 关于英雄构筑
      - 期望保留技能构筑模块
        - 构筑本身的理解成本不高，可以针对交互进行优化（比如英雄本身有更明显的指向，技能也有更明显的指向，对其匹配即可）
        - 抽取技能对于商业化能够提供50%的收益（技能角色一半一半）
        - 技能抽取后即可保留，也能比较容易兼容其他数值模块的加入
        - 存在一定程度上的最优解，不定向的配置也能提供足够深度
      - 另一个方案，参考AFK，玩过觉醒。技能+装备
        - 每个英雄技能固定，但是存在一条独特的天赋树
        - 通过天赋树延伸至不同的分支，扩展英雄的可选方向
        - 引入类似圣遗物或专武的设定
          - 追求获得英雄后转向装备/套装收集，付费转向与刷刷刷`
  },
  {
    id: '5',
    name: '主城建设',
    content: `  - 城市每次升级获得1次拓展次数，拥有拓展次数时可以在城市周边1格范围内选择一格进行拓展
  - 拓展时可以选择各种功能性建筑
    - 资源类建筑（木石粮）
    - 战斗类建筑（兵营、练兵场）
    - 商业类建筑（商店）
    - 科技类建筑（研究）
    - 制造类建筑（铁匠铺）
    - ……
  - 可拓展建筑存在上限和解锁条件
- 放置建筑后即可对其进行功能操作以及进行文官委任
  - 每个建筑设定有委任官员
    - 主官*1：提供技能加成和100%属性加成
    - 副官*2：提供50%属性加成
    - 门生*5：提供20%属性加成
  - 文官：用于委任功能建筑，提供增益
    - 文官拥有政务、学识、魅力共3种属性，属性会影响技能的生效效果
    - 文官拥有不同品质
      - 品质越高，属性上限越高
      - 品质越高，拥有的技能数量越多
        - 固定技能*1，绑定文官，一般直接关联功能建筑（70%收益）
        - 随机技能*1~2，获得时随机，随机技能一般作用在空间效果，给其他格子增益
          - 随机技能也有品质之分，品质越高加成越高（30%收益）
          - 可以消耗资源进行重置
        - 通过固定技能和随机技能，引导玩家在城市的建设布局层面有所投入（主要是随机技能），通过调整建筑位置达到收益最大化`
  }
];

export const PPTMode: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [editContent, setEditContent] = useState('');
  const [editingTabNameId, setEditingTabNameId] = useState<string | null>(null);
  const [editTabName, setEditTabName] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/ppt');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setTabs(data);
            setActiveTabId(data[0].id);
          } else {
            setTabs(DEFAULT_TABS);
            setActiveTabId(DEFAULT_TABS[0].id);
          }
        } else {
          console.error('Failed to fetch PPT data from server');
          setTabs(DEFAULT_TABS);
          setActiveTabId(DEFAULT_TABS[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch PPT data:', error);
        setTabs(DEFAULT_TABS);
        setActiveTabId(DEFAULT_TABS[0].id);
      }
    };

    fetchData();
    
    const savedFontSize = localStorage.getItem('ppt_font_size');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
  }, []);

  const saveTabs = async (newTabs: Tab[]) => {
    setTabs(newTabs);
    // We don't auto-save to file on every change anymore, only on manual save.
    // But we update the local state to keep the UI responsive.
  };

  const handleAddTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: `新页面 ${tabs.length + 1}`,
      content: ''
    };
    const newTabs = [...tabs, newTab];
    saveTabs(newTabs);
    setActiveTabId(newTab.id);
  };

  const handleDeleteTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    saveTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs.length > 0 ? newTabs[0].id : '');
    }
  };

  const handleSaveContent = () => {
    const newTabs = tabs.map(t => t.id === activeTabId ? { ...t, content: editContent } : t);
    saveTabs(newTabs);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      setEditContent(activeTab.content);
      setIsEditing(true);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(12, fontSize + delta);
    setFontSize(newSize);
    localStorage.setItem('ppt_font_size', newSize.toString());
  };

  const handleStartEditTabName = (tab: Tab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabNameId(tab.id);
    setEditTabName(tab.name);
  };

  const handleSaveTabName = () => {
    if (editingTabNameId) {
      const newTabs = tabs.map(t => t.id === editingTabNameId ? { ...t, name: editTabName } : t);
      saveTabs(newTabs);
      setEditingTabNameId(null);
    }
  };

  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const handleInsertImage = () => {
    setShowImageInput(!showImageInput);
    setImageUrl('');
  };

  const confirmInsertImage = () => {
    if (imageUrl) {
      setEditContent(prev => `${prev}\n![图片描述](${imageUrl})\n`);
      setShowImageInput(false);
      setImageUrl('');
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering container events
    setIsResizing(true);
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(e.clientX, window.innerWidth - 100));
      setSidebarWidth(newWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleManualSave = async () => {
    setSaveStatus('saving');
    setStatusMessage('正在保存...');
    
    // Construct the latest data
    const dataToSave = isEditing 
      ? tabs.map(t => t.id === activeTabId ? { ...t, content: editContent } : t)
      : tabs;

    // Update local state
    setTabs(dataToSave);

    // Update server file
    try {
      const response = await fetch('/api/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      
      if (response.ok) {
        // Re-fetch to ensure consistency with file
        const res = await fetch('/api/ppt');
        if (res.ok) {
          const data = await res.json();
          setTabs(data);
          setSaveStatus('success');
          setStatusMessage('保存成功！');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
          setStatusMessage('保存成功，但重新读取失败。');
        }
      } else {
        setSaveStatus('error');
        setStatusMessage('保存失败，服务器返回错误。');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
      setStatusMessage('保存出错：' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Stop propagation for all mouse events to prevent map interaction
  const stopPropagation = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  };

  const [isResetConfirming, setIsResetConfirming] = useState(false);

  const handleReset = async () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setIsResetConfirming(false), 3000);
      return;
    }

    setIsResetConfirming(false);
    
    // Use deep copy to avoid reference issues
    const defaultTabsCopy = JSON.parse(JSON.stringify(DEFAULT_TABS));
    setTabs(defaultTabsCopy);
    setActiveTabId(defaultTabsCopy[0].id);
    
    // Immediately save the default tabs to the server
    try {
      setSaveStatus('saving');
      setStatusMessage('正在重置...');
      
      const response = await fetch('/api/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultTabsCopy),
      });
      
      if (response.ok) {
        setStatusMessage('已重置为默认内容');
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setStatusMessage('重置保存失败');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save reset:', error);
      setStatusMessage('重置出错');
      setSaveStatus('error');
    }
  };

  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Insert 4 spaces for tab
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      setEditContent(newValue);
      
      // Need to defer setting selection range until after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        className="bg-[#222] text-[#00d2ff] border border-[#00d2ff] px-4 py-2 rounded shadow-lg hover:bg-[#333] font-bold cursor-pointer flex items-center gap-2 pointer-events-auto"
      >
        <span>PPT专用</span>
      </button>

      {isOpen && (
        <>
          {/* Full-screen overlay for resizing */}
          {isResizing && (
            <div
              className="fixed inset-0 z-[9999] cursor-ew-resize"
              onMouseMove={handleResizeMove}
              onMouseUp={handleResizeEnd}
              onMouseLeave={handleResizeEnd}
            />
          )}
          
          <div 
            className="fixed top-0 left-0 h-screen bg-[#1a1a1a] border-r border-[#333] z-[100] flex flex-col shadow-2xl text-white pointer-events-auto"
            style={{ width: `${sidebarWidth}px` }}
            onWheel={stopPropagation}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onClick={stopPropagation}
            onMouseMove={stopPropagation}
          >
            {/* Resizer Handle - Increased hit area */}
            <div
              className="absolute top-0 right-[-4px] w-4 h-full cursor-ew-resize z-50 group flex justify-center"
              onMouseDown={startResizing}
            >
              <div className="w-1 h-full group-hover:bg-[#00d2ff] transition-colors" />
            </div>

            <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#222]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-[#00d2ff]">信息预览</h2>
              <button 
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
                className={`px-2 py-1 text-xs border rounded transition-colors ${
                  saveStatus === 'saving' ? 'bg-gray-700 text-gray-400 border-gray-600' :
                  saveStatus === 'success' ? 'bg-green-900/30 text-green-400 border-green-500' :
                  saveStatus === 'error' ? 'bg-red-900/30 text-red-400 border-red-500' :
                  'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff] hover:bg-[#00d2ff]/30'
                }`}
              >
                {saveStatus === 'saving' ? '保存中...' : '写入存档'}
              </button>
              <button
                onClick={handleReset}
                className={`px-2 py-1 text-xs border rounded transition-colors ${
                  isResetConfirming 
                    ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' 
                    : 'bg-red-900/20 text-red-400 border-red-500 hover:bg-red-900/30'
                }`}
              >
                {isResetConfirming ? '确定重置？' : '重置'}
              </button>
              {statusMessage && (
                <span className={`text-xs ${
                  saveStatus === 'success' ? 'text-green-400' : 
                  saveStatus === 'error' ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  {statusMessage}
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-[#333] bg-[#111] scrollbar-hide">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setIsEditing(false);
                }}
                className={`flex items-center gap-2 px-4 py-3 cursor-pointer whitespace-nowrap border-r border-[#333] ${
                  activeTabId === tab.id ? 'bg-[#2a2a2a] text-[#00d2ff] border-b-2 border-b-[#00d2ff]' : 'text-gray-400 hover:bg-[#222]'
                }`}
              >
                {editingTabNameId === tab.id ? (
                  <input
                    type="text"
                    value={editTabName}
                    onChange={(e) => setEditTabName(e.target.value)}
                    onBlur={handleSaveTabName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTabName()}
                    autoFocus
                    className="bg-[#111] text-white border border-[#555] rounded px-1 w-24 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span onDoubleClick={(e) => handleStartEditTabName(tab, e)}>{tab.name}</span>
                )}
                <button
                  onClick={(e) => handleDeleteTab(tab.id, e)}
                  className="text-gray-500 hover:text-red-400 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddTab}
              className="px-4 py-3 text-gray-400 hover:text-white hover:bg-[#222] flex items-center"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col border-b border-[#333] bg-[#222]">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFontSizeChange(-1)}
                  className="p-1.5 bg-[#333] hover:bg-[#444] rounded text-white"
                  title="缩小字号"
                >
                  <Minus size={16} />
                </button>
                <span className="text-sm text-gray-300 w-8 text-center">{fontSize}</span>
                <button
                  onClick={() => handleFontSizeChange(1)}
                  className="p-1.5 bg-[#333] hover:bg-[#444] rounded text-white"
                  title="放大字号"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleInsertImage}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded hover:bg-[#444] ${showImageInput ? 'bg-[#444] text-[#00d2ff]' : 'bg-[#333] text-white'}`}
                    title="插入图片"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={handleSaveContent}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#00d2ff] text-black font-bold rounded hover:bg-[#00b8e6]"
                  >
                    <Save size={16} /> 保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEdit}
                  disabled={!activeTab}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#333] text-white rounded hover:bg-[#444] disabled:opacity-50"
                >
                  <Edit2 size={16} /> 编辑
                </button>
              )}
            </div>
            
            {/* Image Input Area */}
            {isEditing && showImageInput && (
              <div className="p-2 bg-[#1a1a1a] border-t border-[#333] flex gap-2 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="输入图片 URL..."
                  className="flex-1 bg-[#111] border border-[#444] rounded px-2 py-1 text-sm text-white outline-none focus:border-[#00d2ff]"
                  onKeyDown={(e) => e.key === 'Enter' && confirmInsertImage()}
                />
                <button
                  onClick={confirmInsertImage}
                  disabled={!imageUrl}
                  className="px-3 py-1 bg-[#00d2ff] text-black text-sm font-bold rounded hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  插入
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#1a1a1a]">
            {activeTab ? (
              isEditing ? (
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full min-h-[300px] bg-[#111] text-white border border-[#444] rounded p-4 outline-none resize-none focus:border-[#00d2ff] font-mono"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}
                  placeholder="在此输入内容 (支持 Markdown)..."
                />
              ) : (
                <div 
                  className="w-full h-full break-words prose prose-invert max-w-none"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc pl-6 my-2 space-y-1" />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal pl-6 my-2 space-y-1" />
                      ),
                      li: ({ node, ...props }) => (
                        <li {...props} className="pl-1" />
                      ),
                      img: ({ node, ...props }) => (
                        <img 
                          {...props} 
                          referrerPolicy="no-referrer"
                          className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewImage(props.src as string)}
                        />
                      )
                    }}
                  >
                    {activeTab.content || ''}
                  </ReactMarkdown>
                  {!activeTab.content && <span className="text-gray-500 italic">暂无内容，请点击编辑按钮添加。双击页签可以修改名称。</span>}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                请添加或选择一个页签
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-10"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
          onWheel={stopPropagation}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
            onClick={() => setPreviewImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
};
