import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DB_FILE = path.join(process.cwd(), 'server_db.json');

// Initialize database with default structure
function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      teachers: [],
      classes: [],
      questions: [],
      exams: [],
      assignments: [],
      submissions: [],
    };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      teachers: [],
      classes: [],
      questions: [],
      exams: [],
      assignments: [],
      submissions: [],
    };
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving server_db.json:', err);
    return false;
  }
}

// Initialize Gemini SDK with User-Agent and key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' })); // Allow larger payloads for batch questions/images

  // API Route: Get Shared Database State
  app.get('/api/sync-state', (req, res) => {
    try {
      const db = getDB();
      res.json({ success: true, db });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error getting database state' });
    }
  });

  // API Route: Save Shared Database State
  app.post('/api/sync-state', (req, res) => {
    try {
      const clientData = req.body;
      const currentDB = getDB();

      // Merge clientData carefully to avoid erasing existing data on partial syncs
      const updatedDB = {
        teachers: clientData.teachers !== undefined ? clientData.teachers : currentDB.teachers || [],
        classes: clientData.classes !== undefined ? clientData.classes : currentDB.classes || [],
        questions: clientData.questions !== undefined ? clientData.questions : currentDB.questions || [],
        exams: clientData.exams !== undefined ? clientData.exams : currentDB.exams || [],
        assignments: clientData.assignments !== undefined ? clientData.assignments : currentDB.assignments || [],
        submissions: clientData.submissions !== undefined ? clientData.submissions : currentDB.submissions || [],
      };

      saveDB(updatedDB);
      res.json({ success: true, db: updatedDB });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error saving database state' });
    }
  });

  // API Route: Verify Knowledge of Questions
  app.post('/api/verify-knowledge', async (req, res) => {
    try {
      const { questions } = req.body;
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Questions list is required' });
      }

      // Format questions for the audit
      const questionsToAnalyze = questions.map((q, idx) => ({
        index: idx + 1,
        id: q.id,
        content: q.content,
        type: q.type,
        options: q.options || [],
        answer: q.answer,
        explain: q.explain,
      }));

      const prompt = `Bạn là một chuyên gia khảo thí xuất sắc và giáo viên bộ môn tự nhiên THCS (Toán học, Vật lý, Tin học).
Hãy thẩm định và đánh giá tính chính xác của bộ câu hỏi kiểm tra sau đây về mặt kiến thức khoa học, tính sư phạm và đáp án:

${JSON.stringify(questionsToAnalyze, null, 2)}

Hãy rà soát kỹ từng câu hỏi:
1. Đề bài có chính xác không? Có bị sai đề, mâu thuẫn, thiếu giả thuyết hay phi thực tế không?
2. Đáp án đúng ("answer") được chọn có thực sự chính xác không?
   - Với câu trắc nghiệm MCQ (A, B, C, D): Đối chiếu xem "answer" có khớp với nội dung đáp án đúng không.
   - Với câu Đúng/Sai (YESNO): Đối chiếu xem "answer" có hợp lý khoa học không.
   - Với câu Trống/Ngắn (SHORT): Kiểm tra đáp án ngắn nhập vào có chính xác về mặt toán học không.
3. Phần giải thích lý thuyết ("explain") có rõ ràng, mạch lạc và chính xác không?

Hãy phản hồi dưới dạng mảng JSON chứa các đối tượng có định dạng:
[
  {
    "id": "ID câu hỏi",
    "isCorrect": true hoặc false,
    "issueType": "none" hoặc "warning" hoặc "error",
    "feedback": "Phản hồi chi tiết bằng tiếng Việt thẩm định tính đúng đắn hoặc chỉ ra lỗi sai và phương án sửa đổi."
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                issueType: { type: Type.STRING },
                feedback: { type: Type.STRING },
              },
              required: ['id', 'isCorrect', 'issueType', 'feedback'],
            },
          },
        },
      });

      const textResult = response.text || '[]';
      const auditResults = JSON.parse(textResult);
      res.json({ success: true, results: auditResults });
    } catch (error: any) {
      console.error('Audit API Error:', error);
      res.status(500).json({ error: error.message || 'Error auditing questions' });
    }
  });

  // Serve Vite in dev mode, or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer();
