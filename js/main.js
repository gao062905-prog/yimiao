/* ============================================================
   九价守护计划：宫颈癌预防科普大冒险
   JavaScript 游戏引擎 v2
   ============================================================ */

(function () {
  'use strict';

  // ==================== 快捷 DOM 选择器 ====================
  const $  = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ==================== 游戏全局状态 ====================
  const S = {
    mission: 0,          // 0=首页, 1-6=任务, 7=结局
    score: 0,
    badges: [],
    demo: false,
    done: [false, false, false, false, false, false],
    m1: { correct: 0, wrong: 0, found: [] },
    m2: { placed: {}, ok: 0 },
    m3: { matched: 0, timer: null, left: 30, selected: null, pairs: [] },
    m4: { seq: [] },
    m5: { v: false, s: false },
    m6: { answered: 0, ok: 0, done: [] }
  };

  // ==================== 工具函数 ====================
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  function feedback(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'mission-feedback show ' + type;
    setTimeout(() => { if (el) el.classList.remove('show'); }, 3000);
  }

  function badgeToast(name) {
    const t = document.getElementById('badge-toast');
    const n = document.getElementById('badge-toast-name');
    if (n) n.textContent = name;
    if (t) { t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2500); }
  }

  function confetti(n) {
    n = n || 20;
    const c = document.createElement('div');
    c.className = 'confetti-container';
    const e = ['🎉','✨','🌟','💫','🎊','🏅','💖','🛡️'];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'confetti-piece';
      p.textContent = e[i % e.length];
      p.style.left = (5 + Math.random() * 90) + '%';
      p.style.top  = (5 + Math.random() * 50) + '%';
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = (0.8 + Math.random() * 1.2) + 's';
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }

  function addScore(pts) { S.score = Math.min(100, S.score + pts); }

  function progress(n) {
    const pct = Math.round((n / 6) * 100);
    $$('.progress-fill').forEach(p => { p.style.width = pct + '%'; });
  }

  // ==================== 演示模式辅助 ====================
  function demoProgress() {
    const n = S.done.filter(Boolean).length;
    const el = document.getElementById('demo-progress-text');
    if (el) el.textContent = n + '/6';
  }

  function clearHints() {
    $$('.demo-highlight').forEach(e => e.classList.remove('demo-highlight'));
    $$('.demo-hint-text').forEach(e => e.remove());
  }

  function demoHint(num) {
    clearHints();
    const hints = {
      1: { hl: '.mission-card[data-correct="true"]', txt: '💬 HPV 是人乳头瘤病毒，感染很常见。请找出正确的 HPV 卡片。' },
      2: { hl: '.hpv-type-card[data-risk="high"]', txt: '💬 九价覆盖 9 种型别，其中 7 种为高危相关型别。请正确分类。' },
      3: { hl: '.antigen-card', txt: '💬 疫苗通过 VLP 训练免疫系统。请匹配抗原与免疫细胞。' },
      4: { hl: '.step-option', txt: '💬 接种流程有规范步骤，请按正确顺序排列。' },
      5: { hl: '#btn-shield-vaccine', txt: '💬 疫苗和筛查是双重防线，两者互补。请同时点亮。' },
      6: { hl: '.quiz-option', txt: '💬 科学辨别真伪，粉碎谣言。请判断正误。' }
    };
    const h = hints[num];
    if (!h) return;
    if (h.hl) $$(h.hl).forEach(e => e.classList.add('demo-highlight'));
    const mb = document.querySelector('#screen-mission' + num + ' .mission-body');
    if (mb) {
      const d = document.createElement('div');
      d.className = 'demo-hint-text';
      d.textContent = h.txt;
      mb.appendChild(d);
    }
  }

  // ==================== 屏幕导航 ====================
  function goHome() {
    S.mission = 0;
    show('home');
    if (S.demo) demoProgress();
  }

  function goMission(num) {
    S.mission = num;
    show('mission' + num);
    progress(num);
    initMission(num);
    if (S.demo) { demoProgress(); demoHint(num); }
  }

  // ==================== 任务调度 ====================
  function initMission(n) {
    switch (n) {
      case 1: buildMission1(); break;
      case 2: buildMission2(); break;
      case 3: buildMission3(); break;
      case 4: buildMission4(); break;
      case 5: buildMission5(); break;
      case 6: buildMission6(); break;
    }
  }

  // ==================== 开始 / 重置 / 演示 ====================
  function startGame() {
    resetAll();
    S.demo = false;
    const ov = document.getElementById('demo-overlay');
    if (ov) ov.classList.add('hidden');
    clearHints();
    goMission(1);
  }

  function startDemo() {
    resetAll();
    S.demo = true;
    const ov = document.getElementById('demo-overlay');
    if (ov) ov.classList.remove('hidden');
    demoProgress();
    goMission(1);
  }

  function resetAll() {
    S.mission = 0; S.score = 0; S.badges = []; S.demo = false;
    S.done = [false,false,false,false,false,false];
    S.m1 = { correct:0, wrong:0, found:[] };
    S.m2 = { placed:{}, ok:0 };
    S.m3 = { matched:0, timer:null, left:30, selected:null, pairs:[] };
    S.m4 = { seq:[] };
    S.m5 = { v:false, s:false };
    S.m6 = { answered:0, ok:0, done:[] };
    if (S.m3.timer) { clearInterval(S.m3.timer); S.m3.timer = null; }
    const ov = document.getElementById('demo-overlay');
    if (ov) ov.classList.add('hidden');
    clearHints();
    goHome();
  }

  // ==================== 完成任务通用逻辑 ====================
  function completeMission(num) {
    S.done[num-1] = true;
    progress(num);

    const names = { 1:'HPV 识别徽章', 2:'九价覆盖图谱徽章', 3:'免疫记忆徽章', 4:'规范接种徽章', 5:'双重防线徽章', 6:'谣言粉碎徽章' };
    const emoji = { 1:'🔬', 2:'🧬', 3:'🛡️', 4:'🏥', 5:'💉', 6:'💥' };

    S.badges.push({ name: names[num], emoji: emoji[num], m: num });

    const btn = document.getElementById('btn-mission' + num + '-complete');
    if (btn) btn.disabled = false;

    badgeToast(names[num]);
    confetti(15);
    addScore(5);

    if (btn) {
      btn.onclick = function () {
        if (num < 6) goMission(num + 1);
        else showResult();
      };
    }

    if (num === 3 && S.m3.timer) { clearInterval(S.m3.timer); S.m3.timer = null; }
    if (S.demo) demoProgress();
    clearHints();
  }

  // ================================================================
  //   任务一：认识 HPV 病毒
  // ================================================================
  function buildMission1() {
    const grid = document.getElementById('mission1-cards');
    if (!grid) return;

    S.m1 = { correct:0, wrong:0, found:[] };
    const cEl = document.getElementById('m1-correct'); if (cEl) cEl.textContent = '0';
    const wEl = document.getElementById('m1-wrong');   if (wEl) wEl.textContent = '0';
    const fb  = document.getElementById('mission1-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn = document.getElementById('btn-mission1-complete'); if (btn) btn.disabled = true;

    const cards = [
      { icon:'🦠', label:'HPV（人乳头瘤病毒）', desc:'一种常见的病毒', correct:true,  id:'hpv' },
      { icon:'🦠', label:'流感病毒', desc:'引起流行性感冒', correct:false, id:'flu' },
      { icon:'🧫', label:'细菌（如大肠杆菌）', desc:'单细胞微生物', correct:false, id:'ecoli' },
      { icon:'🌿', label:'花粉过敏原', desc:'引起过敏反应', correct:false, id:'pollen' },
      { icon:'🦠', label:'HIV（人类免疫缺陷病毒）', desc:'另一种病毒', correct:false, id:'hiv' },
      { icon:'🧬', label:'高危型 HPV（如 HPV16）', desc:'与宫颈癌风险相关', correct:true,  id:'hpv-high' },
      { icon:'🦠', label:'低危型 HPV（如 HPV6）', desc:'常与生殖器疣相关', correct:true,  id:'hpv-low' },
      { icon:'🍄', label:'真菌（如念珠菌）', desc:'真核微生物', correct:false, id:'fungi' }
    ];
    shuffle(cards);

    grid.innerHTML = '';
    cards.forEach(c => {
      const d = document.createElement('div');
      d.className = 'mission-card';
      d.dataset.correct = c.correct;
      d.dataset.id = c.id;
      d.innerHTML = '<span class="card-icon">'+c.icon+'</span><span class="card-label">'+c.label+'</span><span class="card-desc">'+c.desc+'</span>';
      d.addEventListener('click', function () { clickCard1(d, c); });
      grid.appendChild(d);
    });

    if (S.demo) {
      $$('.mission-card[data-correct="true"]').forEach(c => c.classList.add('demo-highlight'));
    }
  }

  function clickCard1(el, card) {
    if (el.classList.contains('done')) return;
    if (S.m1.found.includes(card.id)) return;
    el.classList.add('done');

    if (card.correct) {
      el.classList.add('correct-card');
      S.m1.correct++;
      S.m1.found.push(card.id);
      const cEl = document.getElementById('m1-correct'); if (cEl) cEl.textContent = S.m1.correct;
      const facts = {
        'hpv':'HPV 感染很常见，多数感染可被机体免疫系统清除。',
        'hpv-high':'部分高危型 HPV（如 HPV16、18）持续感染可能增加宫颈癌风险。',
        'hpv-low':'低危型 HPV（如 HPV6、11）常与生殖器疣相关，致癌风险相对较低。'
      };
      feedback('mission1-feedback', '✅ 正确！'+card.label+'。'+ (facts[card.id]||''), 'correct');
      addScore(5);
      if (S.m1.correct >= 3) completeMission(1);
    } else {
      el.classList.add('wrong-card');
      S.m1.wrong++;
      const wEl = document.getElementById('m1-wrong'); if (wEl) wEl.textContent = S.m1.wrong;
      feedback('mission1-feedback', '❌ 这是'+card.label+'，不是我们要找的 HPV 病毒哦。请继续寻找！', 'wrong');
      if (S.m1.wrong >= 3) {
        feedback('mission1-feedback', '💡 提示：请点击带有"HPV"标签的卡片（共 3 张）。', 'info');
        S.m1.wrong = 0;
        const wEl2 = document.getElementById('m1-wrong'); if (wEl2) wEl2.textContent = '0';
      }
    }
  }

  // ================================================================
  //   任务二：高危型与低危型分拣站
  // ================================================================
  function buildMission2() {
    const pool = document.getElementById('hpv-types-pool');
    const lowD = document.getElementById('zone-low-drop');
    const highD = document.getElementById('zone-high-drop');
    if (!pool || !lowD || !highD) return;

    S.m2 = { placed:{}, ok:0 };
    const fb = document.getElementById('mission2-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn = document.getElementById('btn-mission2-complete'); if (btn) btn.disabled = true;

    lowD.innerHTML = '';
    highD.innerHTML = '';

    const types = [
      { num:'6',  risk:'low',  desc:'常与生殖器疣相关' },
      { num:'11', risk:'low',  desc:'常与生殖器疣相关' },
      { num:'16', risk:'high', desc:'与宫颈癌风险关系密切' },
      { num:'18', risk:'high', desc:'与宫颈癌风险关系密切' },
      { num:'31', risk:'high', desc:'高危型别' },
      { num:'33', risk:'high', desc:'高危型别' },
      { num:'45', risk:'high', desc:'高危型别' },
      { num:'52', risk:'high', desc:'高危型别' },
      { num:'58', risk:'high', desc:'高危型别' }
    ];
    shuffle(types);

    pool.innerHTML = '';
    let selectedCard = null;

    types.forEach(t => {
      const card = document.createElement('div');
      card.className = 'hpv-type-card';
      card.dataset.num = t.num;
      card.dataset.risk = t.risk;
      card.innerHTML = 'HPV ' + t.num + '<br><small>' + t.desc + '</small>';
      card.draggable = true;

      card.addEventListener('click', function () {
        if (card.classList.contains('placed')) return;
        if (selectedCard === card) { card.classList.remove('selected-type'); selectedCard = null; return; }
        if (selectedCard) selectedCard.classList.remove('selected-type');
        card.classList.add('selected-type');
        selectedCard = card;
      });

      card.addEventListener('dragstart', function (e) {
        if (card.classList.contains('placed')) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', t.num);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', function () { card.style.opacity = ''; });

      pool.appendChild(card);
    });

    function setupZone(zone, zoneRisk) {
      zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.parentElement.classList.add('drag-over'); });
      zone.addEventListener('dragleave', function () { zone.parentElement.classList.remove('drag-over'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.parentElement.classList.remove('drag-over');
        const tn = e.dataTransfer.getData('text/plain');
        if (tn) placeType(tn, zoneRisk, zone);
      });
      zone.parentElement.addEventListener('click', function () {
        if (selectedCard && !selectedCard.classList.contains('placed')) {
          placeType(selectedCard.dataset.num, zoneRisk, zone);
          selectedCard.classList.remove('selected-type');
          selectedCard = null;
        }
      });
    }

    setupZone(lowD, 'low');
    setupZone(highD, 'high');

    function placeType(tn, zoneRisk, zone) {
      if (S.m2.placed[tn]) return;
      const card = document.querySelector('.hpv-type-card[data-num="'+tn+'"]');
      if (!card) return;
      const correctRisk = card.dataset.risk;

      S.m2.placed[tn] = true;
      card.classList.add('placed');

      if (zoneRisk === correctRisk) {
        card.classList.add('correct-place');
        S.m2.ok++;
        feedback('mission2-feedback', '✅ HPV '+tn+' 分类正确！', 'correct');
        addScore(3);
        const clone = card.cloneNode(true);
        clone.classList.remove('placed','selected-type');
        clone.classList.add('correct-place');
        clone.draggable = false;
        zone.appendChild(clone);

        if (S.m2.ok >= 9) completeMission(2);
      } else {
        card.classList.add('wrong-place');
        const correctZone = correctRisk === 'low' ? '低危相关型别区' : '高危相关型别区';
        feedback('mission2-feedback', '❌ HPV '+tn+' 应属于'+correctZone+'。仅 HPV6、11 为低危相关。', 'wrong');
        setTimeout(function () {
          card.classList.remove('wrong-place','placed');
          delete S.m2.placed[tn];
        }, 1500);
      }
    }

    if (S.demo) {
      $$('.hpv-type-card[data-risk="high"]').forEach(c => c.classList.add('demo-highlight'));
    }
  }

  // ================================================================
  //   任务三：免疫训练营
  // ================================================================
  function buildMission3() {
    const cluesC = document.getElementById('antigen-clues');
    const cellsC = document.getElementById('immune-cells');
    if (!cluesC || !cellsC) return;

    if (S.m3.timer) clearInterval(S.m3.timer);
    S.m3 = { matched:0, timer:null, left:30, selected:null, pairs:[] };

    const mcEl = document.getElementById('match-count'); if (mcEl) mcEl.textContent = '0';
    const tcEl = document.getElementById('timer-count');  if (tcEl) tcEl.textContent = '30';
    const tmEl = document.getElementById('immune-timer'); if (tmEl) tmEl.classList.remove('urgent');
    const fb   = document.getElementById('mission3-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn  = document.getElementById('btn-mission3-complete'); if (btn) btn.disabled = true;

    const antigens = [
      { id:'a1', text:'抗原线索：HPV16 VLP 特征', match:'c1' },
      { id:'a2', text:'抗原线索：HPV18 VLP 特征', match:'c2' },
      { id:'a3', text:'抗原线索：HPV52 VLP 特征', match:'c3' },
      { id:'a4', text:'抗原线索：HPV58 VLP 特征', match:'c4' }
    ];
    const cells = [
      { id:'c1', text:'🛡️ 免疫记忆细胞（抗 HPV16）' },
      { id:'c2', text:'🛡️ 免疫记忆细胞（抗 HPV18）' },
      { id:'c3', text:'🛡️ 免疫记忆细胞（抗 HPV52）' },
      { id:'c4', text:'🛡️ 免疫记忆细胞（抗 HPV58）' }
    ];

    shuffle(antigens);
    shuffle(cells);

    cluesC.innerHTML = '';
    cellsC.innerHTML = '';

    antigens.forEach(a => {
      const d = document.createElement('div');
      d.className = 'antigen-card';
      d.dataset.id = a.id;
      d.dataset.match = a.match;
      d.textContent = a.text;
      d.addEventListener('click', function () { pickAntigen(d); });
      cluesC.appendChild(d);
    });

    cells.forEach(c => {
      const d = document.createElement('div');
      d.className = 'immune-card';
      d.dataset.id = c.id;
      d.textContent = c.text;
      d.addEventListener('click', function () { matchCell(d); });
      cellsC.appendChild(d);
    });

    S.m3.timer = setInterval(function () {
      S.m3.left--;
      const tcEl2 = document.getElementById('timer-count');
      if (tcEl2) tcEl2.textContent = S.m3.left;
      if (S.m3.left <= 10) {
        const tmEl2 = document.getElementById('immune-timer');
        if (tmEl2) tmEl2.classList.add('urgent');
      }
      if (S.m3.left <= 0) {
        clearInterval(S.m3.timer);
        S.m3.timer = null;
        if (S.m3.matched < 4) {
          feedback('mission3-feedback', '⏰ 时间到！免疫系统需要时间学习，再试一次吧。', 'info');
          $$('.antigen-card').forEach(c => { if (!c.classList.contains('matched')) c.classList.remove('selected-match'); });
          S.m3.selected = null;
        }
      }
    }, 1000);

    if (S.demo) {
      $$('.antigen-card').forEach(c => c.classList.add('demo-highlight'));
    }
  }

  function pickAntigen(el) {
    if (el.classList.contains('matched')) return;
    $$('.antigen-card').forEach(c => c.classList.remove('selected-match'));
    el.classList.add('selected-match');
    S.m3.selected = el.dataset.id;
  }

  function matchCell(cellEl) {
    if (cellEl.classList.contains('matched')) return;
    if (!S.m3.selected) {
      feedback('mission3-feedback', '💡 请先点击左侧的抗原线索，再点击右侧对应的免疫记忆细胞。', 'info');
      return;
    }
    const aEl = document.querySelector('.antigen-card[data-id="'+S.m3.selected+'"]');
    if (!aEl) return;

    const pair = aEl.dataset.match + '-' + cellEl.dataset.id;
    if (S.m3.pairs.includes(pair)) return;

    if (aEl.dataset.match === cellEl.dataset.id) {
      aEl.classList.add('matched');
      cellEl.classList.add('matched');
      aEl.classList.remove('selected-match');
      S.m3.matched++;
      S.m3.pairs.push(pair);
      S.m3.selected = null;
      const mcEl2 = document.getElementById('match-count'); if (mcEl2) mcEl2.textContent = S.m3.matched;
      addScore(4);
      feedback('mission3-feedback', '✅ 匹配正确！免疫系统正在建立识别记录和免疫记忆。', 'correct');
      confetti(6);
      if (S.m3.matched >= 4) completeMission(3);
    } else {
      cellEl.classList.add('wrong-card');
      setTimeout(function () { cellEl.classList.remove('wrong-card'); }, 600);
      feedback('mission3-feedback', '❌ 匹配不正确。请根据型别编号进行匹配（如 HPV16 → 抗 HPV16 细胞）。', 'wrong');
    }
  }

  // ================================================================
  //   任务四：接种流程模拟器
  // ================================================================
  function buildMission4() {
    const seqC = document.getElementById('steps-sequence');
    const poolC = document.getElementById('steps-pool');
    if (!seqC || !poolC) return;

    S.m4 = { seq:[] };
    const fb  = document.getElementById('mission4-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn = document.getElementById('btn-mission4-complete'); if (btn) btn.disabled = true;

    const steps = [
      { id:'s1', order:1, text:'📋 了解适用人群与说明书' },
      { id:'s2', order:2, text:'👨‍⚕️ 咨询医生或接种门诊' },
      { id:'s3', order:3, text:'✍️ 知情同意' },
      { id:'s4', order:4, text:'💉 接种疫苗' },
      { id:'s5', order:5, text:'⏳ 留观（通常约30分钟）' },
      { id:'s6', order:6, text:'📝 记录接种信息' },
      { id:'s7', order:7, text:'📅 按要求完成后续剂次或随访' }
    ];
    shuffle(steps);

    seqC.innerHTML = '<div class="placeholder">👆 请按正确顺序点击下方卡片</div>';
    poolC.innerHTML = '';

    steps.forEach(function (step) {
      const d = document.createElement('div');
      d.className = 'step-option';
      d.dataset.id = step.id;
      d.dataset.order = step.order;
      d.textContent = step.text;
      d.addEventListener('click', function () {
        if (d.classList.contains('used')) return;
        const expected = S.m4.seq.length + 1;
        if (step.order === expected) {
          d.classList.add('used');
          S.m4.seq.push(step);
          const ph = seqC.querySelector('.placeholder'); if (ph) ph.remove();
          const se = document.createElement('div');
          se.className = 'step-card';
          se.innerHTML = '<span class="step-num">'+expected+'</span><span class="step-text">'+step.text+'</span>';
          seqC.appendChild(se);
          se.scrollIntoView({ behavior:'smooth', block:'nearest' });
          addScore(2);
          feedback('mission4-feedback', '✅ 第 '+expected+' 步正确！', 'correct');
          if (S.m4.seq.length >= 7) {
            // 盖章动画
            const stamp = document.createElement('div');
            stamp.className = 'stamp';
            stamp.textContent = '✅';
            document.body.appendChild(stamp);
            setTimeout(function () { stamp.remove(); }, 1000);
            completeMission(4);
          }
        } else {
          d.classList.add('wrong-card');
          setTimeout(function () { d.classList.remove('wrong-card'); }, 600);
          feedback('mission4-feedback', '❌ 这一步顺序不对。请思考正确的接种相关流程。', 'wrong');
        }
      });
      poolC.appendChild(d);
    });

    if (S.demo) {
      $$('.step-option').forEach(c => c.classList.add('demo-highlight'));
    }
  }

  // ================================================================
  //   任务五：双重防线
  // ================================================================
  function buildMission5() {
    S.m5 = { v:false, s:false };
    const fb  = document.getElementById('mission5-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn = document.getElementById('btn-mission5-complete'); if (btn) btn.disabled = true;

    const combined = document.getElementById('combined-shield');
    const msg     = document.getElementById('shield-msg');
    const vStatus = document.getElementById('shield-vaccine-status');
    const sStatus = document.getElementById('shield-screen-status');
    const know    = document.getElementById('shield-knowledge');
    const btnV    = document.getElementById('btn-shield-vaccine');
    const btnS    = document.getElementById('btn-shield-screen');

    if (combined) combined.classList.remove('complete');
    if (msg) msg.textContent = '请点亮两道防线';
    if (vStatus) { vStatus.textContent = '未激活'; vStatus.classList.remove('active'); }
    if (sStatus) { sStatus.textContent = '未激活'; sStatus.classList.remove('active'); }
    if (know) know.innerHTML = '';
    if (btnV) { btnV.className = 'btn btn-shield'; btnV.textContent = '点亮疫苗防线'; }
    if (btnS) { btnS.className = 'btn btn-shield'; btnS.textContent = '点亮筛查防线'; }

    function check() {
      if (S.m5.v && S.m5.s) {
        if (combined) combined.classList.add('complete');
        if (msg) msg.textContent = '🛡️ 双重防线完整！';
        if (know) know.innerHTML = '<p>✅ <strong>完整守护！</strong>宫颈癌预防需要 HPV 疫苗接种和宫颈癌筛查协同配合。</p><p>💡 疫苗不能覆盖所有高危 HPV 型别，因此<strong>不能替代筛查</strong>。接种疫苗后，仍需根据年龄、风险和当地指南进行筛查。</p>';
        addScore(5);
        completeMission(5);
      } else if (S.m5.v && !S.m5.s) {
        if (msg) msg.textContent = '⚠️ 只点亮了疫苗防线';
        if (know) know.innerHTML = '<p>⚠️ <strong>注意：</strong>接种 HPV 疫苗后，仍需根据年龄、风险和当地指南进行<strong>宫颈癌筛查</strong>。疫苗不能覆盖所有高危 HPV 型别。</p>';
      } else if (!S.m5.v && S.m5.s) {
        if (msg) msg.textContent = '⚠️ 只点亮了筛查防线';
        if (know) know.innerHTML = '<p>⚠️ <strong>注意：</strong>筛查能发现癌前病变，但<strong>疫苗可帮助预防</strong>相关型别感染，两者是互补关系。</p>';
      } else {
        if (combined) combined.classList.remove('complete');
        if (msg) msg.textContent = '请点亮两道防线';
        if (know) know.innerHTML = '';
      }
    }

    if (btnV) {
      btnV.onclick = function () {
        S.m5.v = !S.m5.v;
        if (S.m5.v) {
          btnV.className = 'btn btn-shield active-vaccine';
          btnV.textContent = '💉 疫苗防线已激活';
          if (vStatus) { vStatus.textContent = '已激活'; vStatus.classList.add('active'); }
          addScore(5);
        } else {
          btnV.className = 'btn btn-shield';
          btnV.textContent = '点亮疫苗防线';
          if (vStatus) { vStatus.textContent = '未激活'; vStatus.classList.remove('active'); }
        }
        check();
      };
    }

    if (btnS) {
      btnS.onclick = function () {
        S.m5.s = !S.m5.s;
        if (S.m5.s) {
          btnS.className = 'btn btn-shield active-screen';
          btnS.textContent = '🔬 筛查防线已激活';
          if (sStatus) { sStatus.textContent = '已激活'; sStatus.classList.add('active'); }
          addScore(5);
        } else {
          btnS.className = 'btn btn-shield';
          btnS.textContent = '点亮筛查防线';
          if (sStatus) { sStatus.textContent = '未激活'; sStatus.classList.remove('active'); }
        }
        check();
      };
    }

    // 演示模式自动点亮
    if (S.demo) {
      setTimeout(function () { if (btnV) btnV.click(); }, 800);
      setTimeout(function () { if (btnS) btnS.click(); }, 1800);
    }
  }

  // ================================================================
  //   任务六：谣言粉碎机
  // ================================================================
  function buildMission6() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    S.m6 = { answered:0, ok:0, done:[] };
    const qp = document.getElementById('quiz-points'); if (qp) qp.textContent = '0';
    const fb = document.getElementById('mission6-feedback'); if (fb) fb.className = 'mission-feedback';
    const btn = document.getElementById('btn-mission6-complete'); if (btn) btn.disabled = true;

    const quizzes = [
      { q:'九价 HPV 疫苗覆盖 HPV 6、11、16、18、31、33、45、52、58 型。', a:true,
        exp:'✅ 正确！九价 HPV 疫苗正是覆盖这 9 种 HPV 型别。' },
      { q:'接种九价 HPV 疫苗后，就一定不会得宫颈癌。', a:false,
        exp:'❌ 错误！疫苗可降低覆盖型别相关风险，但不能保证 100% 预防所有宫颈癌。' },
      { q:'HPV 疫苗可以治疗已经发生的宫颈癌。', a:false,
        exp:'❌ 错误！HPV 疫苗主要用于预防，不用于治疗已发生的 HPV 感染或宫颈癌。' },
      { q:'接种 HPV 疫苗后仍要重视宫颈癌筛查。', a:true,
        exp:'✅ 正确！接种疫苗不能替代宫颈癌筛查，两者是互补关系。' },
      { q:'所有人任何时候都适合接种九价 HPV 疫苗。', a:false,
        exp:'❌ 错误！是否适合接种应以说明书、接种门诊和专业人员建议为准。' },
      { q:'HPV 感染很常见，科普应避免污名化。', a:true,
        exp:'✅ 正确！HPV 感染在人群中很常见，科普应以科学、尊重的方式进行。' }
    ];
    shuffle(quizzes);

    container.innerHTML = '';
    quizzes.forEach(function (quiz, idx) {
      const item = document.createElement('div');
      item.className = 'quiz-item';
      item.dataset.answer = quiz.a;
      item.innerHTML =
        '<div class="quiz-question">'+(idx+1)+'. '+quiz.q+'</div>' +
        '<div class="quiz-options">' +
          '<button class="quiz-option btn-true" data-value="true">✅ 正确</button>' +
          '<button class="quiz-option btn-false" data-value="false">❌ 错误</button>' +
        '</div>' +
        '<div class="quiz-explanation">'+quiz.exp+'</div>';

      const btT = item.querySelector('.btn-true');
      const btF = item.querySelector('.btn-false');

      function answer(val) {
        if (item.classList.contains('answered-correct') || item.classList.contains('answered-wrong')) return;
        const isRight = (val === quiz.a);
        if (isRight) {
          item.classList.add('answered-correct');
          S.m6.ok++;
          addScore(3);
          feedback('mission6-feedback', '✅ 回答正确！', 'correct');
        } else {
          item.classList.add('answered-wrong');
          feedback('mission6-feedback', '❌ 回答错误。请仔细阅读解释。', 'wrong');
        }
        const expEl = item.querySelector('.quiz-explanation');
        if (expEl) expEl.classList.add('show');
        item.querySelectorAll('.quiz-option').forEach(function (b) {
          b.disabled = true;
          if ((b.dataset.value === 'true') === quiz.a) b.classList.add('correct-choice');
          if ((b.dataset.value === 'true') === val && !isRight) b.classList.add('wrong-choice');
        });
        S.m6.answered++;
        const qp2 = document.getElementById('quiz-points'); if (qp2) qp2.textContent = S.m6.ok;
        if (S.m6.answered >= 6) completeMission(6);
      }

      btT.addEventListener('click', function () { answer(true); });
      btF.addEventListener('click', function () { answer(false); });

      container.appendChild(item);
    });

    if (S.demo) {
      $$('.quiz-option').forEach(c => c.classList.add('demo-highlight'));
    }
  }

  // ================================================================
  //   结局页
  // ================================================================
  function showResult() {
    S.mission = 7;
    show('ending');

    const completed = S.done.filter(Boolean).length;
    const finalScore = Math.min(100, S.score + (completed === 6 ? 10 : 0));
    const sc = document.getElementById('score-circle'); if (sc) sc.textContent = finalScore;

    let title;
    if (finalScore >= 90) title = '🏆 首席宫颈健康科普官';
    else if (finalScore >= 70) title = '🛡️ 九价守护员';
    else if (finalScore >= 50) title = '📚 健康知识学习者';
    else title = '🔍 继续探索挑战者';

    const tt = document.getElementById('ending-title-text'); if (tt) tt.textContent = title;

    const showcase = document.getElementById('badges-showcase');
    if (showcase) {
      const all = [
        { name:'HPV 识别徽章', emoji:'🔬', m:1 },
        { name:'九价覆盖图谱徽章', emoji:'🧬', m:2 },
        { name:'免疫记忆徽章', emoji:'🛡️', m:3 },
        { name:'规范接种徽章', emoji:'🏥', m:4 },
        { name:'双重防线徽章', emoji:'💉', m:5 },
        { name:'谣言粉碎徽章', emoji:'💥', m:6 }
      ];
      showcase.innerHTML = '';
      all.forEach(function (b) {
        const earned = S.done[b.m-1];
        const d = document.createElement('div');
        d.className = 'badge-item ' + (earned ? 'earned' : 'locked');
        d.innerHTML = '<div class="badge-emoji">'+b.emoji+'</div><div class="badge-label">'+b.name+'</div><div class="badge-label">'+(earned?'✅ 已获得':'🔒 未解锁')+'</div>';
        showcase.appendChild(d);
      });
    }

    confetti(30);
    if (S.demo) demoProgress();
  }

  // ================================================================
  //   知识资料 & 参考来源页
  // ================================================================
  function initKnowledgePage() {
    const list = document.getElementById('knowledge-list');
    if (!list || list.dataset.ready) return;
    list.dataset.ready = '1';

    const items = [
      { t:'什么是 HPV？', c:'HPV（人乳头瘤病毒）是一类常见的病毒。大多数 HPV 感染可被机体免疫系统清除，但部分高危型 HPV 持续感染可能增加宫颈癌及相关癌前病变风险。' },
      { t:'九价 HPV 疫苗覆盖哪些型别？', c:'九价 HPV 疫苗覆盖 HPV 6、11、16、18、31、33、45、52、58 型。其中 HPV16、18 等高危型与宫颈癌风险关系密切；HPV6、11 常与生殖器疣相关。' },
      { t:'疫苗的作用机制', c:'HPV 疫苗通过病毒样颗粒（VLP）呈现与病毒相关的特征，帮助免疫系统提前建立识别能力。疫苗不含活病毒，不能导致 HPV 感染。疫苗用于预防，不用于治疗。' },
      { t:'接种疫苗不能替代筛查', c:'接种 HPV 疫苗后，仍需根据年龄、风险和当地指南进行宫颈癌筛查。疫苗不能覆盖所有高危 HPV 型别，筛查可发现癌前病变，两者互补。' },
      { t:'宫颈癌预防三阶梯', c:'宫颈癌预防包括：HPV 疫苗接种（一级预防）、宫颈癌筛查（二级预防）、发现异常后的及时随访和处理（三级预防）。' },
      { t:'重要提示', c:'接种年龄、剂次、间隔、禁忌证和注意事项应以当地批准说明书、疾控机构、接种门诊和医生建议为准。如有过敏史、免疫功能异常、孕期等情况，应咨询专业人员。' }
    ];
    items.forEach(function (item) {
      const d = document.createElement('div');
      d.className = 'knowledge-card-item';
      d.innerHTML = '<h4>'+item.t+'</h4><p>'+item.c+'</p>';
      list.appendChild(d);
    });
  }

  function initReferencePage() {
    const list = document.getElementById('reference-list');
    if (!list || list.dataset.ready) return;
    list.dataset.ready = '1';

    const refs = [
      { t:'WHO - Cervical cancer', u:'https://www.who.int/news-room/fact-sheets/detail/cervical-cancer', d:'世界卫生组织宫颈癌专题' },
      { t:'WHO - How vaccines work', u:'https://www.who.int/news-room/feature-stories/detail/how-do-vaccines-work', d:'疫苗工作原理' },
      { t:'CDC - HPV Vaccine Recommendations', u:'https://www.cdc.gov/hpv/hcp/vaccination-considerations/', d:'美国疾控中心 HPV 疫苗建议' },
      { t:'CDC - HPV Infection', u:'https://www.cdc.gov/std/treatment-guidelines/hpv.htm', d:'HPV 感染相关信息' },
      { t:'中国国家药品监督管理局 (NMPA)', u:'https://www.nmpa.gov.cn/', d:'九价人乳头瘤病毒疫苗说明书及监管资料' }
    ];
    refs.forEach(function (ref) {
      const d = document.createElement('div');
      d.className = 'reference-item';
      d.innerHTML = '<a href="'+ref.u+'" target="_blank" rel="noopener">'+ref.t+'</a><p>'+ref.d+'</p>';
      list.appendChild(d);
    });
  }

  // ================================================================
  //   首页初始化
  // ================================================================
  function initHome() {
    // 背景粒子
    const pc = document.getElementById('home-particles');
    if (pc) {
      const p = ['🦠','💉','🛡️','🧬','🔬','✨','💊','🏥','❤️','🌟'];
      for (let i = 0; i < 18; i++) {
        const s = document.createElement('span');
        s.className = 'home-particle';
        s.textContent = p[i % p.length];
        s.style.left = (Math.random() * 90) + '%';
        s.style.top  = (Math.random() * 90) + '%';
        s.style.animationDelay = (Math.random() * 5) + 's';
        s.style.animationDuration = (4 + Math.random() * 6) + 's';
        s.style.fontSize = (1 + Math.random() * 2) + 'rem';
        pc.appendChild(s);
      }
    }

    // 护盾
    const sh = document.getElementById('home-shield');
    if (sh) sh.textContent = '🛡️';

    // 按钮事件绑定
    function on(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

    on('btn-start-game', startGame);
    on('btn-demo-mode', startDemo);
    on('btn-knowledge', function () { show('knowledge'); });
    on('btn-reference', function () { show('reference'); });
    on('btn-replay', resetAll);
    on('btn-ending-knowledge', function () { show('knowledge'); });
    on('btn-ending-reference', function () { show('reference'); });
    on('btn-ending-demo', startDemo);
    on('btn-demo-exit', function () { S.demo = false; const ov = document.getElementById('demo-overlay'); if (ov) ov.classList.add('hidden'); clearHints(); goHome(); });

    // 返回按钮
    $$('.btn-back').forEach(function (b) {
      b.addEventListener('click', function () { if (b.dataset.goto === 'home') goHome(); });
    });

    // 免责声明
    on('disclaimer-close', function () { const db = document.getElementById('disclaimer-banner'); if (db) db.style.display = 'none'; });
    on('disclaimer-more', function () { const md = document.getElementById('modal-disclaimer'); if (md) md.classList.remove('hidden'); });
    on('modal-disclaimer-close', function () { const md = document.getElementById('modal-disclaimer'); if (md) md.classList.add('hidden'); });

    // 模态框背景点击关闭
    $$('.modal-backdrop').forEach(function (bg) {
      bg.addEventListener('click', function () { bg.parentElement.classList.add('hidden'); });
    });

    // 初始化资料页
    initKnowledgePage();
    initReferencePage();
  }

  // ================================================================
  //   启动
  // ================================================================
  function boot() {
    initHome();
    goHome();
  }

  // DOM 就绪后启动（脚本在 </body> 前，DOM 已可用）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 调试接口
  if (typeof window !== 'undefined') {
    window.gameAPI = {
      state: S, startGame: startGame, startDemo: startDemo,
      goMission: goMission, resetAll: resetAll, showResult: showResult,
      goHome: goHome
    };
  }

  console.log('🛡️ 九价守护计划 游戏引擎 v2 已就绪');
})();
