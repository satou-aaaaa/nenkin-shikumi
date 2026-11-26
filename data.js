// 年金のしくみの問題を作る（ブラウザと node の両方で使う）。
// 中身は、日本年金機構の各ページ（下の SRC）で確かめたことだけ（2026-11-17 に読んだ）。
// 保険料・年金の金額は年ごとに変わるので、答えにも問題にも出さない。人はすべて架空で、性別を決めない。
// 1問は2段：まず「この人は第何号？」（第1号・第2号・第3号）、正解したら「払い方は？」「入る年金は？」「届け出は？」「合う制度は？」のどれか。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// 過去の日の問題を変えないために：NAMES・各種類の sit・ages・asks は変えない（数が変わると同じ tag でも別の問題になる）。
// 種類を足すときは KINDS の最後に、足した日（日本時間）を from に書いて足す。今日の5問・上級は from より前の日には使わない（2026-11-17 CodeRabbit）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "ひねり"];
  const NK = "https://www.nenkin.go.jp/service/";

  // 出典（画面の「なぜ」に出す）。どれも日本年金機構のページ
  const SRC = {
    kind: ["日本年金機構「公的年金制度の種類と加入する制度」", NK + "seidozenpan/20140710.html"],
    kanyu: ["日本年金機構「国民年金に加入するための手続き」", NK + "kokunen/kanyu/20140710-04.html"],
    d2: ["日本年金機構「第2号被保険者」（年金用語集）", NK + "yougo/tagyo/dai2hihokensha.html"],
    d3: ["日本年金機構「第3号被保険者」（年金用語集）", NK + "yougo/tagyo/dai3hihokensha.html"],
    tekiyo: ["日本年金機構「適用事業所と被保険者」", NK + "kounen/tekiyo/jigyosho/20150518.html"],
    gaku: ["日本年金機構「国民年金保険料の学生納付特例制度」", NK + "kokunen/menjo/20150514.html"],
    men: ["日本年金機構「国民年金保険料の免除制度・納付猶予制度」", NK + "kokunen/menjo/20150428.html"],
    san: ["日本年金機構「国民年金保険料の産前産後期間の免除制度」", NK + "kokunen/menjo/20180810.html"],
    iku: ["日本年金機構「国民年金保険料の育児免除制度」", NK + "kokunen/menjo/ikujimenjo.html"],
    hotei: ["日本年金機構「国民年金保険料の法定免除制度」", NK + "kokunen/menjo/20140710.html"],
  };

  // 1段目の選び肢（並びは変えない）
  const GO = ["第1号被保険者", "第2号被保険者", "第3号被保険者"];
  // 2段目の聞き方と、その選び肢（どれも3つ。合う制度だけは5つから3つ）
  const ASK = {
    pay: { q: "保険料の払い方は？", keys: ["p_self", "p_kyuyo", "p_none"] },
    nen: { q: "入っている年金は？", keys: ["n_koku", "n_both", "n_kose"] },
    todo: { q: "加入の届け出は、どこを通す？", keys: ["t_shi", "t_kaisha", "t_haigu"] },
    menjo: { q: "いちばん合う制度は？", keys: ["m_gaku", "m_men", "m_san", "m_iku", "m_hotei"] },
  };
  const GROUPS = {
    p_self: { name: "自分で納める", sub: "納付書や口座振替など" },
    p_kyuyo: { name: "給料から天引き", sub: "勤め先を通じて納める" },
    p_none: { name: "本人の負担はない", sub: "自分では納めない" },
    n_koku: { name: "国民年金だけ", sub: "1階だけ" },
    n_both: { name: "国民年金と厚生年金", sub: "1階と2階" },
    n_kose: { name: "厚生年金だけ", sub: "2階だけ" },
    t_shi: { name: "住所地の市区町村の役所", sub: "本人などが届け出る" },
    t_kaisha: { name: "自分の勤め先", sub: "事業主が届け出る" },
    t_haigu: { name: "配偶者の勤め先", sub: "配偶者の勤め先を通す" },
    m_gaku: { name: "学生納付特例", sub: "学生の納付を先に延ばす" },
    m_men: { name: "免除・納付猶予", sub: "所得が少ないときに申請" },
    m_san: { name: "産前産後の免除", sub: "出産の前後の4か月" },
    m_iku: { name: "育児の免除", sub: "1歳前の子を育てる親" },
    m_hotei: { name: "法定免除", sub: "届け出れば免除になる" },
  };
  // 号ごとの2段目の答え（20140710.html の表のとおり）
  const BY_GO = {
    1: { pay: "p_self", nen: "n_koku", todo: "t_shi" },
    2: { pay: "p_kyuyo", nen: "n_both", todo: "t_kaisha" },
    3: { pay: "p_none", nen: "n_koku", todo: "t_haigu" },
  };

  // 架空の名前（性別を決めない呼び名・「さん」でそろえる）
  const NAMES = ["あおい", "ひかる", "まこと", "しのぶ", "つばさ", "なぎさ", "かおる", "あきら", "ゆうき", "みずき", "はるか", "りお"];

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  const W = ["pay", "nen", "todo"];
  const STU = [20, 21, 22, 23], ADULT = [24, 28, 31, 35, 39, 42, 46, 51, 55, 58], YOUNG = [24, 26, 29, 32, 34, 37];
  // 種類：go（第何号）・asks（2段目の聞き方）・menjo（合う制度）・sit（＠に「名前さん」）・look（ヒント1）・why（説明）
  const KINDS = [
    // ---- やさしい ----
    { id: "jiei", lv: 0, go: 1, asks: W, ages: ADULT, name: "自営業の人", src: ["kind"],
      sit: ["＠は、自分のパン屋を開いている。", "＠は、町で小さな美容室を一人で開いている。", "＠は、自分の店で花を売っている。"],
      look: "会社に勤めているかを見よう。",
      why: "自営業の人は第1号です。入るのは国民年金だけで、保険料は自分で納めます。届け出は住所地の役所です。" },
    { id: "nogyo", lv: 0, go: 1, asks: W, ages: ADULT, name: "農業をする人", src: ["kind"],
      sit: ["＠は、家の畑で野菜を作って売っている。", "＠は、米づくりをしている農家。"],
      look: "会社に勤めているかを見よう。",
      why: "農業をする人は第1号です。入るのは国民年金だけで、保険料は自分で納めます。" },
    { id: "kaisha", lv: 0, go: 2, asks: W, ages: ADULT, name: "会社員", src: ["kind", "d2"],
      sit: ["＠は、会社で事務の仕事をしている会社員。", "＠は、食品の会社に勤める会社員。", "＠は、工場で働く会社員。"],
      look: "会社に勤めている人は何号？",
      why: "会社員は第2号です。国民年金と厚生年金の両方に入り、保険料は給料から天引きされます。届け出は勤め先がします。" },
    { id: "koumu", lv: 0, go: 2, asks: W, ages: ADULT, name: "公務員", src: ["kind", "d2"],
      sit: ["＠は、市役所で働く公務員。", "＠は、県の職員として働いている。"],
      look: "公務員は会社員と同じなかま。",
      why: "公務員も会社員と同じ第2号です。国民年金と厚生年金に入り、保険料は給料から天引きされます。" },
    { id: "fuyo", lv: 0, go: 3, asks: W, ages: ADULT, name: "会社員の配偶者", src: ["kind", "d3"],
      sit: ["＠は、会社員の配偶者に扶養されている。収入はない。", "＠は、会社員の配偶者。仕事はせず、家のことをしている。"],
      look: "扶養しているのは、どんな人？",
      why: "会社員（第2号）に扶養される配偶者は第3号です。入るのは国民年金で、本人の保険料の負担はありません。" },
    { id: "daigaku", lv: 0, go: 1, asks: W, ages: STU, name: "20歳の大学生", src: ["kind"],
      sit: ["＠は、大学に通う学生。", "＠は、短大に通う学生。"],
      look: "学生は、勤め先も扶養の配偶者もない。",
      why: "20歳以上の学生は第1号です。入るのは国民年金だけで、保険料は自分で納めます。" },
    { id: "gakutoku", lv: 0, go: 1, asks: ["menjo"], menjo: "m_gaku", ages: STU, name: "納めるのがむずかしい学生", src: ["kind", "gaku"],
      sit: ["＠は大学生。保険料を納めるのがむずかしい。", "＠は大学院生。収入が少なく、納めるのがむずかしい。"],
      look: "学生には、学生のための制度がある。",
      why: "学生は学生納付特例を申請できます。認められた期間は、あとから10年以内なら追納できます。" },
    // ---- ふつう ----
    { id: "free", lv: 1, go: 1, asks: W, ages: ADULT, name: "フリーランス", src: ["kind"],
      sit: ["＠は、会社に勤めず、イラストの仕事を受けている。", "＠は、フリーランスで翻訳の仕事をしている。"],
      look: "会社に勤めていないなら？",
      why: "会社に勤めずに働く人は、自営業と同じ第1号です。保険料は自分で納め、届け出は住所地の役所です。" },
    { id: "gyogyo", lv: 1, go: 1, asks: W, ages: ADULT, name: "漁業をする人", src: ["kind"],
      sit: ["＠は、自分の船で漁をしている。", "＠は、家族で漁業をしている。"],
      look: "会社に勤めているかを見よう。",
      why: "自分で漁業をする人は第1号です。入るのは国民年金だけで、保険料は自分で納めます。" },
    { id: "taishoku", lv: 1, go: 1, asks: ["todo", "pay", "nen"], ages: ADULT, name: "会社を辞めた人", src: ["kind", "kanyu"],
      sit: ["＠は、会社を辞めて、次の仕事をさがしている。", "＠は、先月で会社を退職した。いまは無職。"],
      look: "会社を辞めたら、厚生年金はどうなる？",
      why: "会社を辞めて無職になると第1号です。退職日の翌日から14日以内に、住所地の役所へ届け出ます。" },
    { id: "kouhai", lv: 1, go: 3, asks: W, ages: ADULT, name: "公務員の配偶者", src: ["kind", "d3"],
      sit: ["＠は、公務員の配偶者に扶養されている。収入はない。", "＠は、市役所で働く配偶者の扶養に入っている。"],
      look: "公務員は第何号だった？",
      why: "公務員は第2号なので、その扶養に入る配偶者は第3号です。本人の保険料の負担はありません。" },
    { id: "pfuyo", lv: 1, go: 3, asks: W, ages: ADULT, name: "扶養に入るパートの人", src: ["kanyu", "d3"],
      sit: ["＠は、会社員の配偶者の扶養に入る。短いパートで厚生年金には入らない。", "＠は週に2日のパート。厚生年金には入らず、会社員の配偶者の扶養に入る。"],
      look: "パートで厚生年金に入っている？",
      why: "厚生年金に入らないパートで、会社員の配偶者の扶養に入る人は第3号です。届け出は配偶者の勤め先を通します。" },
    { id: "senmon", lv: 1, go: 1, asks: ["menjo"], menjo: "m_gaku", ages: STU, name: "専門学校の学生", src: ["gaku"],
      sit: ["＠は専門学校の学生。保険料を納めるのがむずかしい。", "＠は通信制の高校で学ぶ学生。納めるのがむずかしい。"],
      look: "専門学校や通信制も、学生のなかま。",
      why: "学生納付特例は大学だけでなく、専門学校・高校（夜間・通信制も）の学生も使えます。" },
    { id: "menjo", lv: 1, go: 1, asks: ["menjo"], menjo: "m_men", ages: YOUNG, name: "収入が少ない人", src: ["men"],
      sit: ["＠は学生ではない。仕事が見つからず、収入が少ない。", "＠は自営業。店の売り上げが減って、納めるのがむずかしい。"],
      look: "学生ではない人が、納めるのがむずかしいとき。",
      why: "所得が少ないときは、免除や納付猶予を申請できます。納付猶予は50歳未満の人が使えます。" },
    { id: "sanzen", lv: 1, go: 1, asks: ["menjo"], menjo: "m_san", ages: YOUNG, name: "出産をひかえた人", src: ["san"],
      sit: ["＠は自営業。来月、出産する予定。収入は多い。", "＠はフリーランス。収入は多く、2か月後に出産予定。"],
      look: "出産の前後のための制度がある。",
      why: "第1号の人は、出産予定の月の前の月から4か月、保険料が免除されます。所得の条件はありません。" },
    // ---- ひねり ----
    { id: "gaikoku", lv: 2, go: 2, asks: W, ages: ADULT, name: "外国籍の会社員", src: ["tekiyo", "d2"],
      sit: ["＠は外国籍。日本の会社に勤める会社員。", "＠は外国から来て、日本の会社で働く会社員。"],
      look: "国籍で、加入は変わる？",
      why: "厚生年金は、国籍に関係なく、会社に使われて働く人が入ります。会社員なので第2号です。" },
    { id: "shiyo", lv: 2, go: 2, asks: W, ages: YOUNG, name: "試用期間の会社員", src: ["tekiyo"],
      sit: ["＠は、会社に入ったばかり。いまは試用期間中で、給料は出ている。", "＠は新入社員。試用期間中で、給料をもらっている。"],
      look: "試用期間でも、給料をもらっている。",
      why: "試用期間でも、給料をもらって働いていれば厚生年金に入ります。第2号です。" },
    { id: "shigaku", lv: 2, go: 2, asks: ["nen", "pay", "todo"], ages: ADULT, name: "私立学校の先生", src: ["kind"],
      sit: ["＠は、私立の中学校で教える先生。", "＠は、私立の高校の先生。"],
      look: "私立学校の先生も、勤めている人。",
      why: "私立学校の先生は、前は共済年金でしたが、一元化で今は厚生年金に入ります。第2号です。" },
    { id: "p34", lv: 2, go: 2, asks: W, ages: ADULT, name: "長く働くパートの人", src: ["tekiyo"],
      sit: ["＠はパート。働く時間も日数も、正社員の4分の3以上。", "＠はアルバイト。正社員とほぼ同じだけ働いている。"],
      look: "パートでも、働く長さで変わる。",
      why: "パートでも、働く時間と日数が正社員の4分の3以上なら厚生年金に入ります。第2号です。" },
    { id: "jhaigu", lv: 2, go: 1, asks: W, ages: ADULT, name: "自営業の人の配偶者", src: ["kind"],
      sit: ["＠の配偶者は自営業。＠は収入がなく、家のことをしている。", "＠は、農家の配偶者。収入はない。"],
      look: "第3号になるのは、だれの配偶者？",
      why: "第3号は、第2号（会社員など）の配偶者だけ。自営業の人の配偶者は第1号で、自分で納めます。" },
    { id: "tomo", lv: 2, go: 2, asks: W, ages: ADULT, name: "共働きの会社員", src: ["kind", "d2"],
      sit: ["＠は会社員の配偶者。＠自身も会社に勤める会社員。", "＠と配偶者は、二人とも会社員。"],
      look: "配偶者より先に、自分の働き方を見よう。",
      why: "自分も会社員なら、配偶者が会社員でも第2号です。自分で厚生年金に入ります。" },
    { id: "htai", lv: 2, go: 1, asks: ["todo", "pay", "nen"], ages: ADULT, name: "扶養の相手が退職した人", src: ["kanyu", "d3"],
      sit: ["＠は会社員の配偶者の扶養だった。配偶者が退職し、自営業を始めた。", "＠の配偶者は会社を辞めて、店を開いた。＠は収入がない。"],
      look: "配偶者は、まだ第2号？",
      why: "配偶者が第2号でなくなると、扶養されていた人も第3号でなくなり、第1号になります。届け出は役所へ。" },
    { id: "hgaku", lv: 2, go: 3, asks: W, ages: STU, name: "扶養に入る学生", src: ["d3"],
      sit: ["＠は大学生。会社員の配偶者に扶養されている。", "＠は学生で、収入はない。会社員の配偶者の扶養に入る。"],
      look: "学生でも、扶養しているのは会社員の配偶者。",
      why: "第3号は、20歳以上60歳未満で第2号に扶養される配偶者。学生でも当てはまれば第3号です。" },
    { id: "kgaku", lv: 2, go: 1, asks: ["menjo"], menjo: "m_gaku", ages: STU, name: "家族の収入が多い学生", src: ["gaku"],
      sit: ["＠は大学生。家族の収入は多いが、＠の収入は少ない。", "＠は大学院生。親の収入は多い。＠は収入が少ない。"],
      look: "学生の制度は、だれの所得で決まる？",
      why: "学生納付特例は、本人の所得だけで決まります。家族の所得は問いません。" },
    { id: "ikuji", lv: 2, go: 1, asks: ["menjo"], menjo: "m_iku", ages: YOUNG, name: "1歳前の子を育てる親", src: ["iku"],
      sit: ["＠は自営業で収入は多い。子が生まれて半年、育てている。", "＠はフリーランスで収入は多い。生後8か月の子を育てる。"],
      look: "2026年10月から始まった制度がある。",
      why: "2026年10月から、1歳になるまでの子を育てる第1号の親は、保険料が免除されます。所得の条件はありません。" },
    { id: "seikatsu", lv: 2, go: 1, asks: ["menjo"], menjo: "m_hotei", ages: ADULT, name: "生活扶助を受ける人", src: ["hotei"],
      sit: ["＠は、生活保護の生活扶助を受けている。", "＠は無職で、生活保護の生活扶助を受けている。"],
      look: "申請でなく、届け出だけで免除になる人がいる。",
      why: "生活保護の生活扶助を受ける人は、法定免除です。役所に届け出ると、保険料が免除されます。" },
    { id: "shogai", lv: 2, go: 1, asks: ["menjo"], menjo: "m_hotei", ages: ADULT, name: "障害年金を受ける人", src: ["hotei"],
      sit: ["＠は、障害基礎年金（2級）を受けている。", "＠は自営業。障害基礎年金（1級）を受けている。"],
      look: "申請でなく、届け出だけで免除になる人がいる。",
      why: "障害基礎年金（2級以上）を受ける人は、法定免除です。役所に届け出ると、保険料が免除されます。" },
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  // date を渡すと、その日に使える種類だけ（from が無いものは第1回からある種類）。練習・とことんは date なしで全部
  const kindsOf = (lv, date) => KINDS.filter((k) => k.lv === lv && (!date || !k.from || k.from <= date)).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "jiei|2026-11-17:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const R = rng(seedOf(tag));
    const ni = ri(R, 0, NAMES.length - 1), si = ri(R, 0, k.sit.length - 1), ai = ri(R, 0, k.ages.length - 1), qi = ri(R, 0, k.asks.length - 1);
    const who = NAMES[ni] + "さん", age = k.ages[ai], ask = k.asks[qi];
    let g2, grp;
    if (ask === "menjo") { grp = k.menjo; const other = shuffle(R, ASK.menjo.keys.filter((x) => x !== grp)).slice(0, 2); g2 = shuffle(R, [grp, ...other]); }
    else { R(); R(); grp = BY_GO[k.go][ask]; g2 = ASK[ask].keys.slice(); } // R を2回引いて、どの聞き方でも引く回数をそろえる
    const q = k.sit[si].split("＠").join(who);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, why: k.why, src: k.src.map((s) => SRC[s]), media: `${who}・${age}歳`, q,
      opts: GO.slice(), ans: GO[k.go - 1], go: k.go, ask, q2: ASK[ask].q, g2, grp, v: `${ni}:${si}:${ai}:${ask}:${g2.join(",")}` };
  }
  // 同じ問題かを見分ける鍵（種類・名前・言い方・年・聞き方・2段目の選び肢）
  const keyOf = (P) => `${P.kind}:${P.v}`;

  // 今日の5問：やさしい → やさしい → ふつう → ひねり → まとめ（ふつう）。種類は重ねない（game-dev.md 決まり22）
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0, date), 2), n = pickN(R, kindsOf(1, date), 2), h = pickN(R, kindsOf(2, date), 1);
    return [e[0], e[1], n[0], h[0], n[1]].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（ひねりだけ・今日の5問のひねりとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[3].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2, date).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const NENKIN = { KINDS, BY, GROUPS, ASK, GO, BY_GO, NAMES, LV, SRC, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = NENKIN; else root.NENKIN = NENKIN;
})(typeof self !== "undefined" ? self : this);
