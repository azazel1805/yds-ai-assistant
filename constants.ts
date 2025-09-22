
// Fix: Add EXAM_TYPES and DIFFICULTY_LEVELS exports
export const EXAM_TYPES = ["YDS", "YÖKDİL", "e-YDS", "TOEFL", "IELTS"] as const;
export const DIFFICULTY_LEVELS = ["Easy", "Intermediate", "Advanced", "Expert"] as const;

export const QUESTION_TYPES = {
    "Kelime Sorusu": "Kelime Sorusu",
    "Dil Bilgisi Sorusu": "Dil Bilgisi Sorusu",
    "Cloze Test Sorusu": "Cloze Test Sorusu",
    "Cümle Tamamlama Sorusu": "Cümle Tamamlama Sorusu",
    "Çeviri Sorusu": "Çeviri Sorusu",
    "Paragraf Sorusu": "Paragraf Sorusu",
    "Diyalog Tamamlama Sorusu": "Diyalog Tamamlama Sorusu",
    "Restatement (Yeniden Yazma) Sorusu": "Restatement (Yeniden Yazma) Sorusu",
    "Paragraf Tamamlama Sorusu": "Paragraf Tamamlama Sorusu",
    "Akışı Bozan Cümle Sorusu": "Akışı Bozan Cümle Sorusu",
};
