
export interface GrammarRule {
  id: string;
  title: string;
  explanation: string;
  examples: { en: string; tr: string }[];
  ydsTip: string;
}

export const ydsGrammarRules: GrammarRule[] = [
  {
    id: 'tenses_present_perfect',
    title: 'Present Perfect Tense',
    explanation: 'Geçmişte belirsiz bir zamanda başlayan ve etkisi hala devam eden veya şu ana kadar olan eylemleri anlatmak için kullanılır. Genellikle "for", "since", "yet", "already", "just" gibi zarflarla kullanılır.',
    examples: [
      { en: 'She has lived in London for three years.', tr: 'Üç yıldır Londra\'da yaşıyor.' },
      { en: 'I have just finished my homework.', tr: 'Ödevimi daha yeni bitirdim.' },
      { en: 'They haven\'t arrived yet.', tr: 'Henüz gelmediler.' },
    ],
    ydsTip: 'YDS\'de, özellikle "since" + geçmiş zamanlı bir cümle veya "for" + süre belirten ifadelerle birlikte sıkça sorulur. Cümlede "so far", "up to now", "lately" gibi ifadeler varsa Present Perfect Tense doğru cevap olabilir.'
  },
  {
    id: 'tenses_past_perfect',
    title: 'Past Perfect Tense',
    explanation: 'Geçmişte gerçekleşen iki eylemden daha önce olanını anlatmak için kullanılır. "Before", "after", "by the time" gibi bağlaçlarla sıkça görülür.',
    examples: [
      { en: 'By the time we arrived, the train had already left.', tr: 'Biz vardığımızda tren çoktan gitmişti.' },
      { en: 'She told me she had studied French before.', tr: 'Bana daha önce Fransızca çalıştığını söyledi.' },
    ],
    ydsTip: 'YDS\'de "by the time" + Past Simple yapısı gördüğünüzde, ana cümlenin Past Perfect Tense olma olasılığı çok yüksektir. İki geçmiş zaman eylemi arasındaki öncelik-sonralık ilişkisini kurmanız istenir.'
  },
    {
    id: 'quantifiers',
    title: 'Quantifiers (Miktar Belirteçleri)',
    explanation: 'İsimlerin miktarını belirtmek için kullanılırlar. Sayılabilen isimlerle "many, few, a few"; sayılamayan isimlerle "much, little, a little" kullanılır. "Some, any, a lot of" ise her ikisiyle de kullanılabilir.',
    examples: [
        { en: 'There are many books on the shelf.', tr: 'Rafta çok sayıda kitap var.'},
        { en: 'She has little time for hobbies.', tr: 'Hobileri için çok az zamanı var. (yeterli değil)'},
        { en: 'Can I have some water?', tr: 'Biraz su alabilir miyim?'}
    ],
    ydsTip: 'YDS\'de "few" (az ve yetersiz) ile "a few" (az ama yeterli) arasındaki anlam farkı önemlidir. Aynı şekilde "little" ve "a little" farkı da sıkça test edilir. Cümlenin olumlu/olumsuz anlamına dikkat edin.'
  },
  {
    id: 'comparatives_superlatives',
    title: 'Comparatives & Superlatives (Karşılaştırma)',
    explanation: 'Sıfatları kullanarak iki veya daha fazla şeyi karşılaştırmak için kullanılır. "more ... than" veya "-er than" (comparative) ve "the most ..." veya "the -est" (superlative) en yaygın yapılardır.',
    examples: [
        { en: 'This car is more expensive than that one.', tr: 'Bu araba şundan daha pahalı.' },
        { en: 'She is the tallest student in the class.', tr: 'O, sınıftaki en uzun öğrencidir.' },
        { en: 'The exam was as difficult as I expected.', tr: 'Sınav beklediğim kadar zordu.' },
    ],
    ydsTip: 'Paragraf sorularında karşılaştırma yapıları, yazarın görüşünü veya bir durumun derecesini anlamak için anahtar olabilir. "The more..., the more..." kalıbı da YDS\'de sıkça çıkar.'
  },
  {
    id: 'modals_obligation',
    title: 'Modals of Obligation (Zorunluluk)',
    explanation: '"Must" kişisel, içsel bir zorunluluğu ifade ederken, "have to" dışsal bir kural veya gerekliliği belirtir. "Should" ise tavsiye anlamı taşır.',
    examples: [
      { en: 'I must finish this report today.', tr: 'Bu raporu bugün bitirmeliyim. (Kendi kendime koyduğum bir zorunluluk)' },
      { en: 'You have to wear a uniform at this school.', tr: 'Bu okulda üniforma giymek zorundasın. (Bir kural)' },
      { en: 'You should see a doctor if you feel sick.', tr: 'Eğer hasta hissediyorsan bir doktora görünmelisin. (Tavsiye)' },
    ],
    ydsTip: 'Anlam sorularında, cümlenin bağlamına göre doğru modal\'ı seçmeniz gerekir. Cümlenin bir tavsiye mi, güçlü bir zorunluluk mu yoksa bir kural mı içerdiğini anlamak kritiktir.'
  },
    {
    id: 'conjunctions',
    title: 'Conjunctions (Bağlaçlar)',
    explanation: 'Cümleleri veya kelime gruplarını birbirine bağlayan kelimelerdir. Zıtlık (although, but), sebep-sonuç (because, so), zaman (when, while) gibi farklı anlamlar katarlar.',
    examples: [
        { en: 'Although it was raining, we went for a walk.', tr: 'Yağmur yağıyor olmasına rağmen yürüyüşe çıktık.' },
        { en: 'He is successful because he works hard.', tr: 'Çok çalıştığı için başarılı.' }
    ],
    ydsTip: 'YDS\'de özellikle zıtlık ve sebep-sonuç bağlaçları sıkça çıkar. Cümlenin iki tarafı arasındaki anlamsal ilişkiyi doğru tespit etmek, doğru bağlacı bulmanın anahtarıdır.'
  },
  {
    id: 'gerund_infinitive',
    title: 'Gerunds & Infinitives',
    explanation: 'Bazı fiiller kendilerinden sonra "-ing" takısı almış bir fiil (Gerund), bazıları ise "to" ile kullanılan bir fiil (Infinitive) alır. Örneğin "enjoy doing" ama "want to do".',
    examples: [
        { en: 'I enjoy reading books.', tr: 'Kitap okumaktan hoşlanırım.' },
        { en: 'She decided to move to a new city.', tr: 'Yeni bir şehre taşınmaya karar verdi.' }
    ],
    ydsTip: 'Hangi fiilin ardından Gerund, hangisinin ardından Infinitive geldiğini ezberlemek önemlidir. YDS\'de bu kural doğrudan test edilir. "stop to do" (bir şey yapmak için durmak) ve "stop doing" (bir şeyi yapmayı bırakmak) gibi anlam farklarına dikkat edin.'
  },
   {
    id: 'noun_clauses',
    title: 'Noun Clauses (İsim Cümlecikleri)',
    explanation: 'Bir cümlenin içinde özne veya nesne görevi gören yan cümleciklerdir. Genellikle "that, what, who, where, when, why, whether, if" gibi kelimelerle başlarlar.',
    examples: [
        { en: 'What you said is not true.', tr: 'Söylediğin şey doğru değil. (Özne)'},
        { en: 'I don\'t know where she lives.', tr: 'Onun nerede yaşadığını bilmiyorum. (Nesne)'}
    ],
    ydsTip: 'YDS\'de özellikle "that" ve "what" arasındaki fark önemlidir. "that" bir ifadeyi aktarırken, "what" "the thing that" (olan şey) anlamına gelir ve cümlenin bir öğesi eksiktir.'
  },
  {
    id: 'inversions',
    title: 'Inversions (Devrik Cümleler)',
    explanation: 'Cümleye vurgu katmak için normal özne-fiil sıralamasının tersine çevrilmesidir. Genellikle olumsuzluk bildiren zarflar (Never, Rarely, Not only, No sooner) cümlenin başına geldiğinde kullanılır.',
    examples: [
        { en: 'Never have I seen such a beautiful sunset.', tr: 'Hiç bu kadar güzel bir gün batımı görmedim.'},
        { en: 'No sooner had he sat down than the phone rang.', tr: 'O oturur oturmaz telefon çaldı.'}
    ],
    ydsTip: 'Bu yapı, YDS gramer sorularında doğrudan test edilir. Cümlenin başında "Hardly", "Scarcely", "No sooner", "Not only" gibi bir ifade görürseniz, devamında yardımcı fiilin özneden önce geldiği (soru cümlesi gibi) devrik bir yapı aramalısınız.'
  },
  {
    id: 'conditionals_type2',
    title: 'Conditionals - Type 2',
    explanation: 'Şu anki gerçek dışı veya hayali durumları ve bunların olası sonuçlarını anlatmak için kullanılır. Yapısı: If + Simple Past, ... would + V1.',
    examples: [
      { en: 'If I had a million dollars, I would buy a big house.', tr: 'Eğer bir milyon dolarım olsaydı, büyük bir ev alırdım.' },
      { en: 'If I were you, I wouldn\'t do that.', tr: 'Senin yerinde olsaydım, bunu yapmazdım.' },
    ],
    ydsTip: 'YDS\'de if-clause\'un bir tarafı verilip diğer tarafı istenir. Cümlenin şimdiki zamana ait hayali bir durumu anlattığını tespit ederseniz, doğru yapıyı (Simple Past + would V1) seçmeniz gerekir.'
  },
  {
    id: 'conditionals_type1_3',
    title: 'Conditionals - Type 1 & 3',
    explanation: 'Type 1, gelecekteki gerçekçi olasılıkları anlatır (If + Present Simple, ... will + V1). Type 3 ise geçmişteki pişmanlıkları veya gerçekleşmemiş hayali durumları anlatır (If + Past Perfect, ... would have + V3).',
    examples: [
      { en: 'If it doesn\'t rain tomorrow, we will go to the picnic.', tr: 'Eğer yarın yağmur yağmazsa, pikniğe gideceğiz.' },
      { en: 'If I had studied harder, I would have passed the exam.', tr: 'Eğer daha sıkı çalışsaydım, sınavı geçmiş olurdum.' }
    ],
    ydsTip: 'YDS\'de \'if\' cümlesindeki zaman ile ana cümlenin zamanı arasındaki uyum (tense harmony) çok önemlidir. Type 3, özellikle geçmişe yönelik pişmanlık ifade eden paragraf ve restatement sorularında karşınıza çıkabilir.'
  },
  {
    id: 'modals_deduction_possibility',
    title: 'Modals of Deduction & Possibility',
    explanation: 'Mevcut kanıtlara dayanarak mantıksal çıkarımlar yapmak (deduction) veya bir şeyin olasılığını (possibility) belirtmek için kullanılır. \'Must\' (güçlü çıkarım), \'can\'t\' (imkansızlık), \'may/might/could\' (olasılık) gibi modallar kullanılır.',
    examples: [
      { en: 'The lights are on, so they must be at home.', tr: 'Işıklar açık, o yüzden evde olmalılar.' },
      { en: 'He isn\'t answering his phone. He might be busy.', tr: 'Telefonuna cevap vermiyor. Meşgul olabilir.' },
      { en: 'It can\'t be true; I saw him just an hour ago.', tr: 'Bu doğru olamaz; onu daha bir saat önce gördüm.' }
    ],
    ydsTip: 'Paragraf sorularında yazarın bir durum hakkındaki kesinlik derecesini anlamak için bu modallara dikkat edin. \'must have V3\' (geçmişte olmuş olmalı) ve \'might have V3\' (geçmişte olmuş olabilir) gibi geçmiş zaman yapıları da sıkça test edilir.'
  },
   {
    id: 'prepositions_time_place',
    title: 'Prepositions (of Time & Place)',
    explanation: 'Zaman ve yer bildirmek için kullanılan edatlardır. \'in\' (genel zaman/yer: aylar, yıllar, ülkeler, şehirler), \'on\' (daha özel: günler, caddeler), \'at\' (en özel: saatler, belirli noktalar) en yaygın olanlarıdır.',
    examples: [
      { en: 'The meeting is at 3 PM on Monday in the conference room.', tr: 'Toplantı Pazartesi günü saat 3\'te konferans salonunda.' },
      { en: 'He was born in 1990.', tr: '1990 yılında doğdu.' },
      { en: 'The book is on the table.', tr: 'Kitap masanın üzerinde.' }
    ],
    ydsTip: 'YDS\'de preposition soruları doğrudan gramer bilginizi ölçer. Özellikle belirli fiillerle veya sıfatlarla kullanılan kalıplaşmış preposition\'ları (\'depend on\', \'interested in\' gibi) öğrenmek çok önemlidir.'
  },
  {
    id: 'articles',
    title: 'Articles (a/an, the)',
    explanation: 'İsimlerin önünde kullanılan ve onların belirli mi yoksa belirsiz mi olduğunu gösteren kelimelerdir. \'a/an\' herhangi bir, belirsiz bir şeyi ifade ederken, \'the\' belirli, daha önce bahsedilmiş veya tek olan bir şeyi ifade eder.',
    examples: [
      { en: 'I saw a cat in the garden. The cat was black.', tr: 'Bahçede bir kedi gördüm. Kedi siyahtı.' },
      { en: 'The sun rises in the east.', tr: 'Güneş doğudan yükselir.' },
      { en: 'She is an honest person.', tr: 'O dürüst bir insandır.' }
    ],
    ydsTip: 'Genelleme yaparken çoğul isimlerle veya sayılamayan isimlerle \'the\' kullanılmaz (örn: \'Water is essential for life.\'). Ancak belirli bir şeyden bahsediliyorsa kullanılır (örn: \'The water in this bottle is cold.\'). Bu ayrım YDS\'de sıkça test edilir.'
  },
  {
    id: 'relative_clauses',
    title: 'Relative Clauses (Sıfat Cümlecikleri)',
    explanation: 'Bir ismi niteleyen ve onun hakkında ek bilgi veren yan cümleciklerdir. İnsanlar için "who", nesneler/hayvanlar için "which", her ikisi için de (defining clause\'larda) "that" kullanılır.',
    examples: [
      { en: 'The man who lives next door is a doctor.', tr: 'Yan kapıda yaşayan adam bir doktor.' },
      { en: 'This is the book which I was telling you about.', tr: 'Bu sana bahsettiğim kitap.' },
    ],
    ydsTip: 'Boşluktan önce bir insan ismi varsa "who/whom", bir nesne varsa "which" gelme olasılığı yüksektir. "where" yer, "when" zaman, "whose" ise iyelik belirtir. Bu ayrımlara dikkat edilmelidir.'
  },
  {
    id: 'participle_clauses',
    title: 'Participle Clauses (Kısaltmalar)',
    explanation: 'Relative Clause\'ları daha kısa ve akıcı hale getirmek için yapılan kısaltmalardır. Aktif cümleler "-ing" (Present Participle), pasif cümleler "-ed/-en" (Past Participle) ile kısaltılır.',
    examples: [
        { en: 'The man talking to John is my teacher. (who is talking)', tr: 'John\'la konuşan adam benim öğretmenim.' },
        { en: 'The report written by the committee was rejected. (which was written)', tr: 'Komite tarafından yazılan rapor reddedildi.'}
    ],
    ydsTip: 'Bu konu YDS\'nin ileri seviye gramer konularındandır. Cümlenin orijinal halinin aktif mi pasif mi olduğunu doğru belirlemek, doğru kısaltmayı (-ing veya V3) seçmek için kritiktir. Genellikle paragraf ve cümle tamamlama sorularında karşınıza çıkar.'
  },
  {
    id: 'passive_voice',
    title: 'Passive Voice (Edilgen Çatı)',
    explanation: 'Eylemi yapanın değil, eylemden etkilenenin önemli olduğu durumlarda kullanılır. Yapısı: to be + V3 (Past Participle).',
    examples: [
      { en: 'The Mona Lisa was painted by Leonardo da Vinci.', tr: 'Mona Lisa, Leonardo da Vinci tarafından yapıldı.' },
      { en: 'English is spoken all over the world.', tr: 'İngilizce tüm dünyada konuşulur.' },
    ],
    ydsTip: 'YDS\'de cümlenin öznesinin eylemi yapıp yapmadığına dikkat etmelisiniz. Eğer özne eylemden etkileniyorsa (örn: "The bridge was built..."), passive yapı kullanılmalıdır. Tense uyumuna da dikkat etmek gerekir.'
  },
].sort((a, b) => a.title.localeCompare(b.title));
