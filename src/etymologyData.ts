
export interface EtymItem {
  id: string;
  type: 'prefix' | 'root' | 'suffix';
  origin: string; // The actual prefix/root/suffix (e.g., "bio", "pre")
  meaning: string;
  meaningCN: string;
  examples: { word: string; translation: string }[];
}

export const etymologyData: EtymItem[] = [
  // Prefixes
  { id: 'p1', type: 'prefix', origin: 'pre-', meaning: 'Before', meaningCN: '在...之前', examples: [{ word: 'predict', translation: '预测' }, { word: 'prepare', translation: '准备' }, { word: 'preheat', translation: '预热' }] },
  { id: 'p2', type: 'prefix', origin: 're-', meaning: 'Again, back', meaningCN: '再次，返回', examples: [{ word: 'return', translation: '返回' }, { word: 'review', translation: '复习' }, { word: 'redo', translation: '重做' }] },
  { id: 'p3', type: 'prefix', origin: 'un-', meaning: 'Not, opposite', meaningCN: '不，相反', examples: [{ word: 'unhappy', translation: '不快乐' }, { word: 'unknown', translation: '未知的' }, { word: 'unlock', translation: '解锁' }] },
  { id: 'p4', type: 'prefix', origin: 'dis-', meaning: 'Not, apart', meaningCN: '不，分离', examples: [{ word: 'disagree', translation: '不同意' }, { word: 'disappear', translation: '消失' }, { word: 'disconnect', translation: '断开' }] },
  { id: 'p5', type: 'prefix', origin: 'mis-', meaning: 'Wrongly', meaningCN: '错误地', examples: [{ word: 'misunderstand', translation: '误解' }, { word: 'mislead', translation: '误导' }, { word: 'mistake', translation: '错误' }] },
  { id: 'p6', type: 'prefix', origin: 'anti-', meaning: 'Against', meaningCN: '反对，对抗', examples: [{ word: 'antibiotic', translation: '抗生素' }, { word: 'antivirus', translation: '抗病毒' }, { word: 'social', translation: '反社会的' }] },
  { id: 'p7', type: 'prefix', origin: 'sub-', meaning: 'Under', meaningCN: '在...之下', examples: [{ word: 'submarine', translation: '潜艇' }, { word: 'subway', translation: '地铁' }, { word: 'subtitle', translation: '字幕' }] },
  { id: 'p8', type: 'prefix', origin: 'inter-', meaning: 'Between', meaningCN: '在...之间', examples: [{ word: 'international', translation: '国际的' }, { word: 'internet', translation: '互联网' }, { word: 'interview', translation: '面试' }] },
  { id: 'p9', type: 'prefix', origin: 'trans-', meaning: 'Across', meaningCN: '横穿，转变', examples: [{ word: 'transport', translation: '运输' }, { word: 'translate', translation: '翻译' }, { word: 'transform', translation: '转变' }] },
  { id: 'p10', type: 'prefix', origin: 'auto-', meaning: 'Self', meaningCN: '自我，自动', examples: [{ word: 'automatic', translation: '自动的' }, { word: 'automobile', translation: '汽车' }, { word: 'autobiography', translation: '自传' }] },

  // Roots
  { id: 'r1', type: 'root', origin: 'bio', meaning: 'Life', meaningCN: '生命', examples: [{ word: 'biology', translation: '生物学' }, { word: 'biography', translation: '传记' }, { word: 'biosphere', translation: '生物圈' }] },
  { id: 'r2', type: 'root', origin: 'geo', meaning: 'Earth', meaningCN: '地球，地理', examples: [{ word: 'geography', translation: '地理' }, { word: 'geology', translation: '地质学' }, { word: 'geometry', translation: '几何' }] },
  { id: 'r3', type: 'root', origin: 'phon', meaning: 'Sound', meaningCN: '声音', examples: [{ word: 'telephone', translation: '电话' }, { word: 'phonics', translation: '自然拼读' }, { word: 'symphony', translation: '交响乐' }] },
  { id: 'r4', type: 'root', origin: 'graph', meaning: 'Write', meaningCN: '写，画', examples: [{ word: 'graphic', translation: '图形的' }, { word: 'autograph', translation: '亲笔签名' }, { word: 'photography', translation: '摄影' }] },
  { id: 'r5', type: 'root', origin: 'dict', meaning: 'Say', meaningCN: '说，断言', examples: [{ word: 'dictionary', translation: '字典' }, { word: 'predict', translation: '预测' }, { word: 'dictate', translation: '口授' }] },
  { id: 'r6', type: 'root', origin: 'spec', meaning: 'Look', meaningCN: '看', examples: [{ word: 'spectacles', translation: '眼镜' }, { word: 'inspect', translation: '检查' }, { word: 'respect', translation: '尊重' }] },
  { id: 'r7', type: 'root', origin: 'port', meaning: 'Carry', meaningCN: '携带，运送', examples: [{ word: 'portable', translation: '便携的' }, { word: 'import', translation: '进口' }, { word: 'export', translation: '出口' }] },
  { id: 'r8', type: 'root', origin: 'vid/vis', meaning: 'See', meaningCN: '看', examples: [{ word: 'video', translation: '视频' }, { word: 'vision', translation: '视力' }, { word: 'visible', translation: '可见的' }] },
  { id: 'r9', type: 'root', origin: 'scrib/scrip', meaning: 'Write', meaningCN: '写', examples: [{ word: 'describe', translation: '描述' }, { word: 'script', translation: '脚本' }, { word: 'subscribe', translation: '订阅' }] },
  { id: 'r10', type: 'root', origin: 'struct', meaning: 'Build', meaningCN: '建造，结构', examples: [{ word: 'structure', translation: '结构' }, { word: 'construct', translation: '建造' }, { word: 'instruct', translation: '指导' }] },
  { id: 'r11', type: 'root', origin: 'chron', meaning: 'Time', meaningCN: '时间', examples: [{ word: 'chronic', translation: '慢性的' }, { word: 'chronological', translation: '按时间顺序的' }, { word: 'synchronize', translation: '同步' }] },
  { id: 'r12', type: 'root', origin: 'therm', meaning: 'Heat', meaningCN: '热', examples: [{ word: 'thermometer', translation: '温度计' }, { word: 'thermal', translation: '热的' }, { word: 'thermos', translation: '热水瓶' }] },
  { id: 'r13', type: 'root', origin: 'hydr', meaning: 'Water', meaningCN: '水', examples: [{ word: 'hydrate', translation: '补水' }, { word: 'hydrogen', translation: '氢' }, { word: 'hydroelectric', translation: '水电的' }] },
  { id: 'r14', type: 'root', origin: 'psych', meaning: 'Mind', meaningCN: '心理，精神', examples: [{ word: 'psychology', translation: '心理学' }, { word: 'psychiatrist', translation: '精神科医生' }, { word: 'psychic', translation: '通灵的' }] },
  { id: 'r15', type: 'root', origin: 'path', meaning: 'Feeling, suffering', meaningCN: '感情，痛苦', examples: [{ word: 'empathy', translation: '同理心' }, { word: 'sympathy', translation: '同情' }, { word: 'pathology', translation: '病理学' }] },

  // Suffixes
  { id: 's1', type: 'suffix', origin: '-able/-ible', meaning: 'Can be done', meaningCN: '能够...的', examples: [{ word: 'comfortable', translation: '舒适的' }, { word: 'visible', translation: '可见的' }, { word: 'flexible', translation: '灵活的' }] },
  { id: 's2', type: 'suffix', origin: '-er/-or', meaning: 'One who does', meaningCN: '做...的人', examples: [{ word: 'teacher', translation: '老师' }, { word: 'actor', translation: '演员' }, { word: 'writer', translation: '作家' }] },
  { id: 's3', type: 'suffix', origin: '-ful', meaning: 'Full of', meaningCN: '充满...的', examples: [{ word: 'beautiful', translation: '美丽的' }, { word: 'helpful', translation: '有帮助的' }, { word: 'careful', translation: '小心的' }] },
  { id: 's4', type: 'suffix', origin: '-less', meaning: 'Without', meaningCN: '没有...的', examples: [{ word: 'hopeless', translation: '绝望的' }, { word: 'fearless', translation: '无畏的' }, { word: 'careless', translation: '粗心的' }] },
  { id: 's5', type: 'suffix', origin: '-ment', meaning: 'Action or process', meaningCN: '行为，过程', examples: [{ word: 'enjoyment', translation: '享受' }, { word: 'development', translation: '发展' }, { word: 'agreement', translation: '同意' }] },
  { id: 's6', type: 'suffix', origin: '-ness', meaning: 'State or quality', meaningCN: '状态，性质', examples: [{ word: 'happiness', translation: '幸福' }, { word: 'kindness', translation: '善良' }, { word: 'darkness', translation: '黑暗' }] },
  { id: 's7', type: 'suffix', origin: '-tion/-sion', meaning: 'State or action', meaningCN: '状态，行动', examples: [{ word: 'action', translation: '行动' }, { word: 'decision', translation: '决定' }, { word: 'education', translation: '教育' }] },
  { id: 's8', type: 'suffix', origin: '-ly', meaning: 'In a manner', meaningCN: '...地', examples: [{ word: 'quickly', translation: '快速地' }, { word: 'happily', translation: '幸福地' }, { word: 'slowly', translation: '缓慢地' }] },
  { id: 's9', type: 'suffix', origin: '-ous', meaning: 'Possessing qualities of', meaningCN: '具有...特征的', examples: [{ word: 'joyous', translation: '欢乐的' }, { word: 'dangerous', translation: '危险的' }, { word: 'famous', translation: '著名的' }] },
  { id: 's10', type: 'suffix', origin: '-ist', meaning: 'Person who practices', meaningCN: '...专家，...者', examples: [{ word: 'artist', translation: '艺术家' }, { word: 'scientist', translation: '科学家' }, { word: 'dentist', translation: '牙医' }] },
];
