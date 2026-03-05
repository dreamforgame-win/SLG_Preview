import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, Minus, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Tab {
  id: string;
  name: string;
  content: string;
}

const DEFAULT_TABS: Tab[] = [
  { id: '1', name: '第一页', content: '这里是第一页的内容...' }
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
          // Fallback to local storage if API fails or not available
          const saved = localStorage.getItem('ppt_tabs');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setTabs(parsed);
              if (parsed.length > 0) setActiveTabId(parsed[0].id);
            } catch (e) {
              setTabs(DEFAULT_TABS);
              setActiveTabId(DEFAULT_TABS[0].id);
            }
          } else {
            setTabs(DEFAULT_TABS);
            setActiveTabId(DEFAULT_TABS[0].id);
          }
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
    localStorage.setItem('ppt_tabs', JSON.stringify(newTabs));
    
    try {
      await fetch('/api/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTabs),
      });
    } catch (error) {
      console.error('Failed to save PPT data to server:', error);
    }
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

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Stop propagation for all mouse events to prevent map interaction
  const stopPropagation = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
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
        <div 
          className="fixed top-0 left-0 h-screen w-1/4 min-w-[300px] bg-[#1a1a1a] border-r border-[#333] z-[100] flex flex-col shadow-2xl text-white pointer-events-auto"
          onWheel={stopPropagation}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onClick={stopPropagation}
          onMouseMove={stopPropagation}
        >
          <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#222]">
            <h2 className="text-lg font-bold text-[#00d2ff]">信息预览</h2>
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
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-[#111] text-white border border-[#444] rounded p-4 outline-none resize-none focus:border-[#00d2ff]"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                  placeholder="在此输入内容 (支持 Markdown)..."
                />
              ) : (
                <div 
                  className="w-full h-full break-words prose prose-invert max-w-none"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                >
                  <ReactMarkdown
                    components={{
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
