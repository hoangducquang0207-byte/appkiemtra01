/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Syllabus, Question, Exam, QuestionType, QuestionLevel } from '../types';
import MathText from './MathText';
import {
  Sparkles, HelpCircle, Save, Download, FileText, CheckCircle, Square, CheckSquare,
  Upload, Trash2, Plus, ArrowUp, ArrowDown, Edit3, X, Eye, FileSpreadsheet, Clipboard, Trash, RefreshCw, BookOpen, Database
} from 'lucide-react';

// HELPER: Translates generic TeX equations inside $...$ block into standards-compliant Word MathML (Equation editor)
export function translateLatexToMathML(latex: string): string {
  let clean = latex.trim();
  if (clean.startsWith('$$') && clean.endsWith('$$')) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('$') && clean.endsWith('$')) {
    clean = clean.slice(1, -1).trim();
  }

  // Preprocessing
  let text = clean;

  // 1. Normalize fractions
  text = text.replaceAll('\\dfrac', '\\frac');
  text = text.replaceAll('\\tfrac', '\\frac');
  text = text.replaceAll('\\cfrac', '\\frac');

  // 2. Systems of equations
  const arrayRegex = /\\left\\\s*\{\s*\\begin\{array\}\{[a-zA-Z]*\}([\s\S]*?)\\end\{array\}\s*\\right\.?/g;
  text = text.replace(arrayRegex, (match, inner) => {
    return `\\system{${inner}}`;
  });

  const casesRegex = /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g;
  text = text.replace(casesRegex, (match, inner) => {
    return `\\system{${inner}}`;
  });

  // 3. Remove scaling delimiters \left and \right
  text = text.replace(/\\left(?![a-zA-Z])/g, '');
  text = text.replace(/\\right(?![a-zA-Z])/g, '');

  // 4. Run symbol map with lookahead boundary to prevent prefix collisions (e.g. \le inside \left)
  const symbolMap: { [key: string]: string } = {
    '\\pm': '±',
    '\\times': '×',
    '\\div': '÷',
    '\\leq': '≤',
    '\\le': '≤',
    '\\geq': '≥',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\Delta': 'Δ',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\phi': 'φ',
    '\\omega': 'ω',
    '\\infty': '∞',
    '\\in': '∈',
    '\\notin': '∉',
    '\\subset': '⊂',
    '\\supset': '⊃',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\sum': '∑',
    '\\int': '∫',
    '\\sqrt': '√',
    '\\mathbb{N}^*': 'ℕ*',
    '\\mathbb{N}': 'ℕ',
    '\\mathbb{R}': 'ℝ',
    '\\mathbb{Z}': 'ℤ',
    '\\mathbb{Q}': 'ℚ',
    '\\{': '{',
    '\\}': '}',
    '\\\\': '\n'
  };

  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  Object.keys(symbolMap).forEach((key) => {
    const escaped = escapeRegExp(key);
    let rex: RegExp;
    if (/^\\[a-zA-Z]+$/.test(key)) {
      rex = new RegExp(escaped + '(?![a-zA-Z])', 'g');
    } else {
      rex = new RegExp(escaped, 'g');
    }
    text = text.replace(rex, symbolMap[key]);
  });

  // 5. Replace spacing commands
  text = text.replace(/\\,/g, ' ');
  text = text.replace(/\\:/g, ' ');
  text = text.replace(/\\;/g, ' ');
  text = text.replace(/\\!/g, '');
  text = text.replace(/\\quad/g, '  ');
  text = text.replace(/\\qquad/g, '    ');

  // 6. Strip remaining backslashes from letters (e.g. \sin -> sin)
  text = text.replace(/\\([a-zA-Z]+)/g, '$1');

  // Helper functions used recursively
  const findMatchingBrace = (str: string, startIndex: number): number => {
    let depth = 1;
    for (let j = startIndex + 1; j < str.length; j++) {
      if (str[j] === '{') depth++;
      else if (str[j] === '}') {
        depth--;
        if (depth === 0) return j;
      }
    }
    return -1;
  };

  const findMatchingBraceLeft = (str: string, endIndex: number): number => {
    let depth = 1;
    for (let j = endIndex - 1; j >= 0; j--) {
      if (str[j] === '}') depth++;
      else if (str[j] === '{') {
        depth--;
        if (depth === 0) return j;
      }
    }
    return 0;
  };

  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const parseToXML = (expr: string): string => {
    expr = expr.trim();
    if (!expr) return '';

    // A. Handle custom system structure recursively
    let systemIndex = expr.indexOf('\\system{');
    if (systemIndex !== -1) {
      const start = systemIndex + 7; // index of '{'
      const end = findMatchingBrace(expr, start);
      if (end !== -1) {
        const before = expr.slice(0, systemIndex);
        const inner = expr.slice(start + 1, end);
        const after = expr.slice(end + 1);

        const rows = inner.split(/\\\\/).map(r => r.trim()).filter(r => r.length > 0);
        const rowsXml = rows.map(r => `<mtr><mtd>${parseToXML(r)}</mtd></mtr>`).join('');

        return parseToXML(before) + 
               `<mrow><mo>{</mo><mtable>${rowsXml}</mtable></mrow>` + 
               parseToXML(after);
      }
    }

    // B. Handle fractions recursively
    let fracIndex = expr.indexOf('\\frac');
    if (fracIndex !== -1) {
      const numStart = expr.indexOf('{', fracIndex + 5);
      if (numStart !== -1) {
        const numEnd = findMatchingBrace(expr, numStart);
        if (numEnd !== -1) {
          const denStart = expr.indexOf('{', numEnd + 1);
          if (denStart !== -1) {
            const denEnd = findMatchingBrace(expr, denStart);
            if (denEnd !== -1) {
              const before = expr.slice(0, fracIndex);
              const num = expr.slice(numStart + 1, numEnd);
              const den = expr.slice(denStart + 1, denEnd);
              const after = expr.slice(denEnd + 1);

              return parseToXML(before) + 
                     `<mfrac><mrow>${parseToXML(num)}</mrow><mrow>${parseToXML(den)}</mrow></mfrac>` + 
                     parseToXML(after);
            }
          }
        }
      }
    }

    // C. Handle square roots recursively
    let sqrtIndex = expr.indexOf('\\sqrt');
    if (sqrtIndex !== -1) {
      const start = expr.indexOf('{', sqrtIndex + 5);
      if (start !== -1) {
        const end = findMatchingBrace(expr, start);
        if (end !== -1) {
          const before = expr.slice(0, sqrtIndex);
          const inner = expr.slice(start + 1, end);
          const after = expr.slice(end + 1);

          return parseToXML(before) + 
                 `<msqrt><mrow>${parseToXML(inner)}</mrow></msqrt>` + 
                 parseToXML(after);
        }
      }
    }

    // D. Handle powers (superscript) ^ or indices (subscript) _
    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (char === '^' || char === '_') {
        const isPower = char === '^';
        let baseStart = i - 1;
        if (expr[i - 1] === '}') {
          baseStart = findMatchingBraceLeft(expr, i - 1);
        } else {
          while (baseStart > 0 && /[a-zA-Z0-9]/.test(expr[baseStart - 1])) {
            baseStart--;
          }
        }
        if (baseStart < 0) baseStart = 0;
        const base = expr.slice(baseStart, i);
        const before = expr.slice(0, baseStart);

        let valStart = i + 1;
        let valEnd = i + 1;
        let valInner = '';
        if (expr[i + 1] === '{') {
          valStart = i + 1;
          valEnd = findMatchingBrace(expr, valStart);
          if (valEnd !== -1) {
            valInner = expr.slice(valStart + 1, valEnd);
            valEnd++;
          } else {
            valEnd = expr.length;
            valInner = expr.slice(valStart);
          }
        } else {
          while (valEnd < expr.length && /[a-zA-Z0-9]/.test(expr[valEnd])) {
            valEnd++;
          }
          if (valEnd === i + 1) valEnd = i + 2;
          valInner = expr.slice(i + 1, valEnd);
        }

        const after = expr.slice(valEnd);
        const tag = isPower ? 'msup' : 'msub';

        return parseToXML(before) + 
               `<${tag}><mrow>${parseToXML(base)}</mrow><mrow>${parseToXML(valInner)}</mrow></${tag}>` + 
               parseToXML(after);
      }
    }

    // E. Wrap everything else into proper tokenized elements
    let built = '';
    const tokenRegex = /([0-9\.]+|[a-zA-Z]+|[-+=\/*\(\)\[\]\{\}±×÷≤≥≠αβγδΔθλμπσω∞∈∉⊂⊃∪∩∀∃≈≡∑∫√:\n\r|.,;!?]+|\s+)/g;
    const tokens = expr.match(tokenRegex) || [expr];

    tokens.forEach((tok) => {
      const escaped = escapeXml(tok);
      if (/^[0-9\.]+$/.test(tok)) {
        built += `<mn>${escaped}</mn>`;
      } else if (/^[a-zA-Z]+$/.test(tok)) {
        built += `<mi>${escaped}</mi>`;
      } else if (/^\s+$/.test(tok)) {
        built += `<mspace width="0.22em"/>`;
      } else if (tok === '\n' || tok === '\r' || tok === '\r\n') {
        built += `<br/>`;
      } else {
        built += `<mo>${escaped}</mo>`;
      }
    });

    return built;
  };

  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${parseToXML(text)}</math>`;
}

// Format multi-line sentence with LaTeX mixed chunks into Office MathML segments
export function formatMathForWord(text: string): string {
  if (!text) return '';
  const parts = text.split(/(\$\$?.*?\s??\$\$?)/g);
  let html = '';
  parts.forEach((part) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const mathml = translateLatexToMathML(part);
      html += `<div style="text-align: center; margin: 8px 0;">${mathml}</div>`;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const mathml = translateLatexToMathML(part);
      html += ` ${mathml} `;
    } else {
      const escaped = part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      html += escaped;
    }
  });
  return html;
}

export function generateDocxBlob(
  title: string,
  subject: string,
  grade: string,
  duration: number,
  questions: Question[]
): Blob {
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: 21cm 29.7cm; /* A4 */
          margin: 2cm 2cm 2cm 2cm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000000;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .header-table td {
          border: none;
          padding: 4px;
        }
        .bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .title {
          font-size: 15pt;
          font-weight: bold;
          text-align: center;
          margin-top: 20px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }
        .question {
          margin-bottom: 12px;
          display: block;
        }
        .options-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .options-table td {
          border: none;
          padding: 4px;
          width: 25%;
        }
        .explain-box {
          background-color: #f9f9f9;
          border-left: 3px solid #00a86b;
          padding: 8px;
          margin-top: 6px;
          margin-bottom: 16px;
          font-style: italic;
          color: #444444;
        }
        .page-break {
          page-break-before: always;
        }
        math {
          font-family: 'Cambria Math', 'Times New Roman', serif;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td width="55%" class="text-center bold" style="text-align: center;">
            SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐA PHÂN HỢP<br>
            TRƯỜNG THCS - THPT CHUẨN ĐẦU RA CV 7991
          </td>
          <td width="45%" class="text-center bold" style="text-align: center;">
            ĐỀ KHẢO SÁT CHẤT LƯỢNG THƯỜNG NIÊN<br>
            NĂM HỌC 2026 - 2027
          </td>
        </tr>
      </table>

      <div class="title" style="text-align: center;">
        ĐỀ THI: ${title}<br>
        <span style="font-size: 12pt; font-weight: normal; text-transform: none;">
          Môn học: ${subject} — Khối: Lớp ${grade} | Thời gian làm bài: ${duration} phút
        </span>
      </div>

      <hr style="border: 1px double #000000; margin-bottom: 24px;">

      <div class="bold" style="margin-bottom: 12px; font-weight: bold;">I. PHẦN ĐỀ BÀI</div>
  `;

  // Append questions
  questions.forEach((q, idx) => {
    html += `
      <div class="question" style="margin-bottom: 12px;">
        <span class="bold" style="font-weight: bold;">Câu ${idx + 1}:</span> [${q.level}] 
        ${formatMathForWord(q.content)}
      </div>
    `;

    if (q.type === 'MCQ' && q.options && q.options.length >= 4) {
      html += `
        <table class="options-table" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 25%; padding: 4px;"><span class="bold" style="font-weight: bold;">A.</span> ${formatMathForWord(q.options[0])}</td>
            <td style="width: 25%; padding: 4px;"><span class="bold" style="font-weight: bold;">B.</span> ${formatMathForWord(q.options[1])}</td>
            <td style="width: 25%; padding: 4px;"><span class="bold" style="font-weight: bold;">C.</span> ${formatMathForWord(q.options[2])}</td>
            <td style="width: 25%; padding: 4px;"><span class="bold" style="font-weight: bold;">D.</span> ${formatMathForWord(q.options[3])}</td>
          </tr>
        </table>
      `;
    } else if (q.type === 'YESNO' && q.options && q.options.length >= 4) {
      html += `
        <table class="options-table" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="width: 50%; padding: 4px;"><span class="bold" style="font-weight: bold;">a/</span> ${formatMathForWord(q.options[0])}</td>
            <td style="width: 50%; padding: 4px;"><span class="bold" style="font-weight: bold;">b/</span> ${formatMathForWord(q.options[1])}</td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 4px;"><span class="bold" style="font-weight: bold;">c/</span> ${formatMathForWord(q.options[2])}</td>
            <td style="width: 50%; padding: 4px;"><span class="bold" style="font-weight: bold;">d/</span> ${formatMathForWord(q.options[3])}</td>
          </tr>
        </table>
      `;
    }
  });

  // Solutions page break
  html += `
    <div style="page-break-before: always; clear: both; margin-top: 30px;"></div>
    <div class="title" style="text-align: center; margin-top: 30px;">HƯỚNG DẪN GIẢI CHI TIẾT & ĐÁP ÁN CHUẨN XÁC</div>
    <table class="header-table" style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td class="bold" style="font-weight: bold;">Môn học: ${subject}</td>
        <td style="text-align: right; font-weight: bold;" class="bold">Lớp: ${grade}</td>
      </tr>
    </table>
    <hr style="border: 1px solid #000000; margin-bottom: 20px;">
  `;

  questions.forEach((q, idx) => {
    let readableAns = q.answer;
    if (q.type === 'MCQ') {
      readableAns = ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer;
    } else if (q.type === 'YESNO') {
      readableAns = q.answer
        .split(',')
        .map((val, oIdx) => `${['a', 'b', 'c', 'd'][oIdx]} (${val === 'true' ? 'Đúng' : 'Sai'})`)
        .join(', ');
    }

    html += `
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <div class="bold" style="font-weight: bold;">Câu ${idx + 1}: [Mức độ ${q.level}]</div>
        <div style="margin-top: 4px;">🎯 <span class="bold" style="font-weight: bold;">Đáp án chuẩn:</span> <span style="color: #008000; font-weight: bold;">${readableAns}</span></div>
        <div class="explain-box" style="background-color: #f9f9f9; border-left: 3px solid #00a86b; padding: 8px; margin-top: 6px; margin-bottom: 16px; font-style: italic; color: #444444;">
          <span class="bold" style="font-weight: bold;">Lời giải giảng giải:</span><br>
          ${formatMathForWord(q.explain)}
        </div>
      </div>
    `;
  });

  html += `
    </body>
    </html>
  `;

  return new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
}

// HELPER: Deduplicates questions by ID and content text (case-insensitive & trimmed)
export function deduplicateQuestions(qs: Question[]): Question[] {
  const seenIds = new Set<string>();
  const seenContents = new Set<string>();
  return qs.filter((q) => {
    const trimmedContent = q.content.trim().toLowerCase();
    if (seenIds.has(q.id) || seenContents.has(trimmedContent)) {
      return false;
    }
    seenIds.add(q.id);
    seenContents.add(trimmedContent);
    return true;
  });
}

interface CreateExamPanelProps {
  syllabus: Syllabus[];
  questions: Question[];
  onSaveExamToBank: (exam: Omit<Exam, 'id' | 'createdAt' | 'status'>) => void;
  onNavigate: (moduleName: string) => void;
  onAIQuestionsCreated: (newQs: Question[]) => void;
}

export default function CreateExamPanel({
  syllabus,
  questions,
  onSaveExamToBank,
  onNavigate,
  onAIQuestionsCreated,
}: CreateExamPanelProps) {
  // DESIGN MODES
  const [creationMode, setCreationMode] = useState<'matrix' | 'manual' | 'fromBank'>('matrix');

  // Config counts & points for the 4 question types (shared/unified across all views)
  const [qCountMcq, setQCountMcq] = useState(12);
  const [qPointMcq, setQPointMcq] = useState(0.25); // total = 3.0đ

  const [qCountYesNo, setQCountYesNo] = useState(4);
  const [qPointYesNo, setQPointYesNo] = useState(1.0); // total = 4.0đ

  const [qCountShort, setQCountShort] = useState(6);
  const [qPointShort, setQPointShort] = useState(0.5); // total = 3.0đ

  const [qCountEssay, setQCountEssay] = useState(0);
  const [qPointEssay, setQPointEssay] = useState(0.0); // total = 0.0đ

  // GENERATOR & SWAP LOGIC FOR REPLACING UNSUITABLE QUESTIONS
  const generateRandomQuestionOnTheFly = (
    subName: string,
    gradeName: string,
    qType: QuestionType,
    qLevel: QuestionLevel,
    chId: string,
    leId: string,
    topicName: string,
    offset: number
  ): Question => {
    const id = `q-swap-gen-${qType.toLowerCase()}-${Math.floor(Math.random() * 1000000)}`;
    const i = offset;
    if (subName === 'Toán') {
      if (qType === 'MCQ') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'MCQ',
          content: `[Đề xuất mới] Cho biểu thức bậc hai $P(x) = x^2 - ${i + 6}x + ${i * 3 + 8}$. Tìm giá trị của x để biểu thức đạt giá trị nhỏ nhất.`,
          options: [`$x = ${i + 3}$`, `$x = -${i + 3}$`, `$x = 0$`, `$x = 2$`],
          answer: '0',
          explain: `Đưa về dạng bình phương hoàn hảo: $P(x) = (x - ${i + 3})^2 - ${(i + 3) * (i + 3) - (i * 3 + 8)}$. Đạt cực tiểu tại $x = ${i + 3}$.`,
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else if (qType === 'YESNO') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'YESNO',
          content: `[Đề xuất mới] Xét tính đúng hoặc sai của các phát biểu toán học sau liên quan đến phương trình bậc hai $ax^2 + bx + c = 0$:`,
          options: [
            'a) Nếu $\\Delta > 0$, phương trình luôn có hai nghiệm phân biệt.',
            'b) Nếu $\\Delta = 0$, phương trình có nghiệm kép.',
            'c) Nếu $\\Delta < 0$, phương trình vô nghiệm trên tập số thực.',
            'd) Tích hai nghiệm của phương trình luôn bằng $-b/a$.',
          ],
          answer: 'true,true,true,false',
          explain: 'Mệnh đề d sai vì theo định lý Vi-ét, tích hai nghiệm bằng c/a chứ không phải -b/a.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else if (qType === 'SHORT') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'SHORT',
          content: `[Đề xuất mới] Cho tam giác có độ dài đáy là ${10 + i} cm và chiều cao tương ứng là ${6 + i} cm. Tính diện tích tam giác đó (nhập đơn vị cm²).`,
          options: [],
          answer: `${((10 + i) * (6 + i)) / 2}`,
          explain: `Áp dụng công thức tính diện tích tam giác: $S = \\frac{1}{2} \\times \\text{đáy} \\times \\text{chiều cao} = \\frac{1}{2} \\times ${10 + i} \\times ${6 + i} = ${((10 + i) * (6 + i)) / 2}$ cm².`,
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'ESSAY',
          content: `[Đề xuất mới/Tự luận] Trình bày quy tắc khai phương một tích và quy tắc nhân các căn bậc hai. Cho ví dụ minh họa chi tiết.`,
          options: [],
          answer: 'Phát biểu đúng quy tắc và cho ví dụ tính căn thức.',
          explain: 'Học sinh phát biểu đầy đủ công thức $\\sqrt{A \\cdot B} = \\sqrt{A} \\cdot \\sqrt{B}$ (với $A, B \\ge 0$) và áp dụng làm ví dụ.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      }
    } else {
      // Tin học
      if (qType === 'MCQ') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'MCQ',
          content: `[Đề xuất mới] Trong các thiết bị sau, thiết bị nào đóng vai trò là thiết bị ngoại vi chỉ làm nhiệm vụ nhập dữ liệu (Input Device)?`,
          options: ['Bàn phím (Keyboard)', 'Màn hình (Monitor)', 'Máy in (Printer)', 'Loa (Speaker)'],
          answer: '0',
          explain: 'Bàn phím là thiết bị thu nhận thông tin gõ từ người dùng đưa vào máy tính xử lý.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else if (qType === 'YESNO') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'YESNO',
          content: `[Đề xuất mới] Hãy xác định tính Đúng/Sai của các phát biểu sau đây về chức năng của hệ điều hành máy tính:`,
          options: [
            'a) Hệ điều hành giúp kết nối và quản lý trực tiếp phần cứng máy tính.',
            'b) Hệ điều hành cung cấp giao diện để người dùng tương tác thuận tiện.',
            'c) Máy tính cá nhân hoàn toàn có thể chạy tốt tất cả các phần mềm ứng dụng mà không cần cài đặt hệ điều hành.',
            'd) Windows, Linux và macOS là các hệ điều hành phổ biến.',
          ],
          answer: 'true,true,false,true',
          explain: 'Phát biểu c sai vì phần mềm ứng dụng cần chạy trên nền tảng quản lý của hệ điều hành chứ không thể chạy trực tiếp trên phần cứng trần.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else if (qType === 'SHORT') {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'SHORT',
          content: `[Đề xuất mới] Hãy cho biết 1 Kilobyte (KB) dữ liệu tương đương với bao nhiêu Byte (B) dữ liệu? (nhập số nguyên thuần túy).`,
          options: [],
          answer: '1024',
          explain: 'Theo đơn vị đo lường nhị phân của tin học, 1 KB = 2¹⁰ Byte = 1024 Byte.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      } else {
        return {
          id,
          grade: gradeName,
          subject: subName,
          book: 'Kết nối tri thức',
          chapterId: chId,
          lessonId: leId,
          topic: topicName,
          type: 'ESSAY',
          content: `[Đề xuất mới/Tự luận] Trình bày khái niệm và lợi ích của mạng máy tính toàn cầu Internet đối với đời sống, học tập hiện nay.`,
          options: [],
          answer: 'Nêu khái niệm Internet và các lợi ích học tập, liên lạc, tra cứu.',
          explain: 'Học sinh cần làm rõ tính kết nối toàn cầu và chỉ ra ít nhất 3 tác động tích cực trong học tập, nghiên cứu và kết nối xã hội.',
          level: qLevel,
          source: 'Hệ thống tự động',
          status: 'Đã duyệt',
        };
      }
    }
  };

  const handleSwapMatrixQuestion = (idx: number) => {
    if (!tempExam || generatedQPreview.length === 0) return;

    const oldQ = generatedQPreview[idx];
    const usedIds = new Set(generatedQPreview.map((q) => q.id));

    // Look for matching questions in the deduplicated bank
    const uniqueBank = deduplicateQuestions(questions);
    const possibleReplacements = uniqueBank.filter((q) => {
      return (
        q.subject === tempExam.subject &&
        q.grade === tempExam.grade &&
        q.type === oldQ.type &&
        !usedIds.has(q.id)
      );
    });

    let newQ: Question;

    if (possibleReplacements.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleReplacements.length);
      newQ = possibleReplacements[randomIndex];
    } else {
      newQ = generateRandomQuestionOnTheFly(
        tempExam.subject,
        tempExam.grade,
        oldQ.type,
        oldQ.level,
        oldQ.chapterId || 'ch-general',
        oldQ.lessonId || 'le-general',
        oldQ.topic || 'Nội dung bồi dưỡng',
        idx + 15
      );
    }

    const newPreview = [...generatedQPreview];
    newPreview[idx] = newQ;
    setGeneratedQPreview(newPreview);

    const updatedQuestions = [...tempExam.questions];
    updatedQuestions[idx] = newQ.id;
    setTempExam({
      ...tempExam,
      questions: updatedQuestions,
    });
  };

  const handleSwapBankQuestion = (idx: number) => {
    if (selectedBankQuestions.length === 0) return;

    const oldQ = selectedBankQuestions[idx];
    const usedIds = new Set(selectedBankQuestions.map((q) => q.id));

    const uniqueBank = deduplicateQuestions(questions);
    const possibleReplacements = uniqueBank.filter((q) => {
      return (
        q.subject === bankSub &&
        q.grade === bankGrade &&
        q.type === oldQ.type &&
        !usedIds.has(q.id)
      );
    });

    let newQ: Question;

    if (possibleReplacements.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleReplacements.length);
      newQ = possibleReplacements[randomIndex];
    } else {
      newQ = generateRandomQuestionOnTheFly(
        bankSub,
        bankGrade,
        oldQ.type,
        oldQ.level || 'Thông hiểu',
        oldQ.chapterId || 'ch-general',
        oldQ.lessonId || 'le-general',
        oldQ.topic || 'Nội dung bồi dưỡng',
        idx + 25
      );
    }

    const newSelected = [...selectedBankQuestions];
    newSelected[idx] = newQ;
    setSelectedBankQuestions(newSelected);
  };

  // Selected questions from question bank states
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Question[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSelectedTypes, setBankSelectedTypes] = useState<QuestionType[]>(['MCQ', 'YESNO', 'SHORT', 'ESSAY']);
  const [bankSelectedLevels, setBankSelectedLevels] = useState<QuestionLevel[]>(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']);
  const [bankActiveSubTab, setBankActiveSubTab] = useState<'browse' | 'selected'>('browse');

  // BANK METADATA STATES
  const [bankTitle, setBankTitle] = useState('Đề kiểm tra ôn tập tinh tuyển từ ngân hàng câu hỏi');
  const [bankSub, setBankSub] = useState('Toán');
  const [bankGrade, setBankGrade] = useState('6');
  const [bankDuration, setBankDuration] = useState(45);
  const [bankType, setBankType] = useState('giữa kỳ');

  // MANUAL CREATION STATES
  const [manualTitle, setManualTitle] = useState('Đề khảo sát kiểm tra rèn luyện tự soạn');
  const [manualSub, setManualSub] = useState('Toán');
  const [manualGrade, setManualGrade] = useState('6');
  const [manualDuration, setManualDuration] = useState(45);
  const [manualType, setManualType] = useState('ôn tập');

  const [manualQuestions, setManualQuestions] = useState<Question[]>([
    {
      id: 'q-manual-demo-1',
      grade: '6',
      subject: 'Toán',
      book: 'Kết nối tri thức',
      chapterId: 'ch-demo',
      lessonId: 'le-demo',
      topic: 'Kiến thức cốt lõi',
      type: 'MCQ',
      content: 'Cho phương trình bậc hai một ẩn số phức $x^2 + 5x + 6 = 0$. Tìm tích số hai nghiệm phân biệt $x_1 \\times x_2$ áp dụng định lý Vi-ét.',
      options: [
        '$x_1 \\times x_2 = 6$',
        '$x_1 \\times x_2 = -6$',
        '$x_1 \\times x_2 = 5$',
        '$x_1 \\times x_2 = -5$'
      ],
      answer: '0',
      explain: 'Theo định lý Vi-ét cho phương trình bậc hai hằng số tự nhiên, tích hai nghiệm bằng $c/a = 6/1 = 6$.',
      level: 'Thông hiểu',
      source: 'Mẫu có sẵn',
      status: 'Đã duyệt'
    },
    {
      id: 'q-manual-demo-2',
      grade: '6',
      subject: 'Toán',
      book: 'Kết nối tri thức',
      chapterId: 'ch-demo',
      lessonId: 'le-demo',
      topic: 'Kiến thức cốt lõi',
      type: 'MCQ',
      content: 'Trong hệ trục tọa độ, rút gọn biểu thức khoảng cách phức hợp sau $d = \\sqrt{x_0^2 + y_0^2} = \\sqrt{3^2 + 4^2}$. Giá trị của $d$ là bao nhiêu?',
      options: [
        '$d = 5$',
        '$d = 25$',
        '$d = 7$',
        '$d = 12$'
      ],
      answer: '0',
      explain: 'Tính toán: $d = \\sqrt{9 + 16} = \\sqrt{25} = 5$.',
      level: 'Nhận biết',
      source: 'Mẫu có sẵn',
      status: 'Đã duyệt'
    }
  ]);

  // SINGLE REUSABLE EDIT/ADD MODAL OR COLLAPSIBLE
  const [editingQId, setEditingQId] = useState<string | null>(null);

  // CURRENT ACTIVE MANUALLY CONSTRUCTED QUESTION FORM STATE
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<QuestionType>('MCQ');
  const [formLevel, setFormLevel] = useState<QuestionLevel>('Nhận biết');
  const [formExplain, setFormExplain] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formAnswer, setFormAnswer] = useState('0');

  // FILE UPLOAD AND PASTE
  const [dragActive, setDragActive] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parseStatus, setParseStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Parameters
  const [sub, setSub] = useState('Toán');
  const [grade, setGrade] = useState('6');
  const [type, setType] = useState('kiểm tra thường xuyên');
  const [title, setTitle] = useState('Đề luyện kiểm tra Môn Toán - Lớp 6');
  const [count, setCount] = useState(4);
  const [duration, setDuration] = useState(15);

  const [pctNb, setPctNb] = useState(40);
  const [pctTh, setPctTh] = useState(30);
  const [pctVd, setPctVd] = useState(20);
  const [pctVdc, setPctVdc] = useState(10);

  const [typesSelected, setTypesSelected] = useState<QuestionType[]>(['MCQ', 'YESNO', 'SHORT', 'ESSAY']);

  // Loading/Staging
  const [isGenerating, setIsGenerating] = useState(false);
  const [matrixData, setMatrixData] = useState<Array<{ title: string; countNb: number; countTh: number; countVd: number; countVdc: number }>>([]);
  const [tempExam, setTempExam] = useState<Omit<Exam, 'id' | 'createdAt' | 'status'> | null>(null);
  const [generatedQPreview, setGeneratedQPreview] = useState<Question[]>([]);

  // User selected chapters & lessons for matrix creation
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // User selected chapters & lessons for question bank compilation
  const [bankSelectedChapterIds, setBankSelectedChapterIds] = useState<string[]>([]);
  const [bankSelectedLessonIds, setBankSelectedLessonIds] = useState<string[]>([]);

  // Automatically select all chapters and lessons when sub or grade changes
  useEffect(() => {
    const activeSyl = syllabus.find((sy) => sy.subject === sub && sy.grade === grade);
    if (activeSyl) {
      const chIds = activeSyl.chapters.map((ch) => ch.id);
      setSelectedChapterIds(chIds);
      
      const lesIds: string[] = [];
      activeSyl.chapters.forEach((ch) => {
        ch.lessons.forEach((les) => {
          lesIds.push(les.id);
        });
      });
      setSelectedLessonIds(lesIds);
    } else {
      setSelectedChapterIds([]);
      setSelectedLessonIds([]);
    }
  }, [sub, grade, syllabus]);

  // Automatically select all chapters and lessons when bankSub or bankGrade changes
  useEffect(() => {
    const activeSyl = syllabus.find((sy) => sy.subject === bankSub && sy.grade === bankGrade);
    if (activeSyl) {
      const chIds = activeSyl.chapters.map((ch) => ch.id);
      setBankSelectedChapterIds(chIds);
      
      const lesIds: string[] = [];
      activeSyl.chapters.forEach((ch) => {
        ch.lessons.forEach((les) => {
          lesIds.push(les.id);
        });
      });
      setBankSelectedLessonIds(lesIds);
    } else {
      setBankSelectedChapterIds([]);
      setBankSelectedLessonIds([]);
    }
  }, [bankSub, bankGrade, syllabus]);

  const activeSyllabusObj = syllabus.find((sy) => sy.subject === sub && sy.grade === grade);
  const currentChapters = activeSyllabusObj?.chapters || [];

  const bankActiveSyllabusObj = syllabus.find((sy) => sy.subject === bankSub && sy.grade === bankGrade);
  const bankCurrentChapters = bankActiveSyllabusObj?.chapters || [];

  const toggleTypeSelected = (t: QuestionType) => {
    if (typesSelected.includes(t)) {
      setTypesSelected(typesSelected.filter((item) => item !== t));
    } else {
      setTypesSelected([...typesSelected, t]);
    }
  };

  const totalCalculatedCount = qCountMcq + qCountYesNo + qCountShort + qCountEssay;
  const totalCalculatedScore = parseFloat(
    (
      qCountMcq * qPointMcq +
      qCountYesNo * qPointYesNo +
      qCountShort * qPointShort +
      qCountEssay * qPointEssay
    ).toFixed(2)
  );

  const renderTypeConfigControls = () => {
    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Clipboard className="w-4 h-4 text-emerald-600" />
            Cấu hình số câu & điểm từng loại
          </span>
          {totalCalculatedScore === 10 ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Đạt 10 điểm
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Khác 10đ ({totalCalculatedScore}đ)
            </span>
          )}
        </div>
        
        <div className="space-y-3 mt-1">
          {/* MCQ Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="w-5/12 font-bold text-slate-600">Trắc nghiệm MCQ:</div>
            <div className="w-3/12 flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={qCountMcq}
                onChange={(e) => setQCountMcq(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">câu</span>
            </div>
            <div className="w-4/12 flex items-center gap-1 justify-end">
              <input
                type="number"
                step={0.05}
                min={0}
                value={qPointMcq}
                onChange={(e) => setQPointMcq(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">đ/câu</span>
            </div>
          </div>

          {/* YESNO Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="w-5/12 font-bold text-slate-600">Đúng / Sai:</div>
            <div className="w-3/12 flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={qCountYesNo}
                onChange={(e) => setQCountYesNo(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">câu</span>
            </div>
            <div className="w-4/12 flex items-center gap-1 justify-end">
              <input
                type="number"
                step={0.05}
                min={0}
                value={qPointYesNo}
                onChange={(e) => setQPointYesNo(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">đ/câu</span>
            </div>
          </div>

          {/* SHORT Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="w-5/12 font-bold text-slate-600">Trả lời ngắn:</div>
            <div className="w-3/12 flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={qCountShort}
                onChange={(e) => setQCountShort(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">câu</span>
            </div>
            <div className="w-4/12 flex items-center gap-1 justify-end">
              <input
                type="number"
                step={0.05}
                min={0}
                value={qPointShort}
                onChange={(e) => setQPointShort(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">đ/câu</span>
            </div>
          </div>

          {/* ESSAY Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="w-5/12 font-bold text-slate-600">Tự luận:</div>
            <div className="w-3/12 flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={qCountEssay}
                onChange={(e) => setQCountEssay(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">câu</span>
            </div>
            <div className="w-4/12 flex items-center gap-1 justify-end">
              <input
                type="number"
                step={0.05}
                min={0}
                value={qPointEssay}
                onChange={(e) => setQPointEssay(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-14 text-center border border-slate-200 bg-white py-1 px-1.5 rounded-md outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400">đ/câu</span>
            </div>
          </div>

          {/* Totals panel */}
          <div className="flex justify-between items-center bg-white border border-slate-150 p-2 rounded-lg text-xs font-bold text-slate-700 mt-2">
            <span>Tổng số câu: <span className="text-indigo-600 font-extrabold">{totalCalculatedCount} câu</span></span>
            <span>Thang điểm: <span className="text-emerald-600 font-extrabold">{totalCalculatedScore}đ</span></span>
          </div>
        </div>
      </div>
    );
  };

    const handleCreateExamSubmit = () => {
    if (totalCalculatedCount <= 0) {
      alert('Vui lòng chọn số câu lớn hơn 0 trước khi xây dựng Ma trận đề!');
      return;
    }
    setIsGenerating(true);

    setTimeout(() => {
      // Create mockup matrix
      const fullChapters = syllabus.find((sy) => sy.subject === sub && sy.grade === grade)?.chapters || [
        { id: 'ch-general', title: 'Khối kiến thức rèn luyện tổng hợp', lessons: [] },
      ];

      // Filter active chapters according to user selection (or fallback to all if none selected)
      const activeChapters = fullChapters.filter(ch => selectedChapterIds.includes(ch.id));
      const finalChapters = activeChapters.length > 0 ? activeChapters : fullChapters;

      const newMatrix = finalChapters.map((ch, idx) => {
        const share = Math.floor(totalCalculatedCount / finalChapters.length);
        const remainder = idx === 0 ? totalCalculatedCount % finalChapters.length : 0;
        const totalCh = share + remainder;

        const countNb = Math.max(0, Math.round((pctNb / 100) * totalCh));
        const countTh = Math.max(0, Math.round((pctTh / 100) * totalCh));
        const countVd = Math.max(0, Math.round((pctVd / 100) * totalCh));
        const countVdc = Math.max(0, totalCh - (countNb + countTh + countVd));

        return {
          title: ch.title,
          countNb,
          countTh,
          countVd,
          countVdc,
        };
      });

      setMatrixData(newMatrix);

      // Extract existing matched items or generate fresh ones
      const uniqueLocalPool = deduplicateQuestions(questions);
      const matchedLocal = uniqueLocalPool.filter((q) => {
        const matchSubGrade = q.subject === sub && q.grade === grade;
        if (!matchSubGrade) return false;
        
        // If specific chapters were selected, match them!
        if (selectedChapterIds.length > 0 && !selectedChapterIds.includes(q.chapterId)) {
          return false;
        }
        // If specific lessons were selected, match them too!
        if (selectedLessonIds.length > 0 && q.lessonId && !selectedLessonIds.includes(q.lessonId)) {
          return false;
        }
        return true;
      });

      const generatedQs: Question[] = [];
      const finalSelectedQs: Question[] = [];

      const types: { type: QuestionType; targetCount: number }[] = [
        { type: 'MCQ', targetCount: qCountMcq },
        { type: 'YESNO', targetCount: qCountYesNo },
        { type: 'SHORT', targetCount: qCountShort },
        { type: 'ESSAY', targetCount: qCountEssay },
      ];

      types.forEach(({ type, targetCount }) => {
        if (targetCount <= 0) return;
        const localOfType = matchedLocal.filter((q) => q.type === type);
        // Shuffle the matched local questions to guarantee non-duplicate selections
        const shuffledLocal = [...localOfType].sort(() => 0.5 - Math.random());
        const selectedLocal = shuffledLocal.slice(0, targetCount);
        finalSelectedQs.push(...selectedLocal);

        const needed = targetCount - selectedLocal.length;
        for (let i = 0; i < needed; i++) {
          const id = `q-matrix-gen-${type.toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
          const level: QuestionLevel =
            i % 4 === 0
              ? 'Nhận biết'
              : i % 4 === 1
              ? 'Thông hiểu'
              : i % 4 === 2
              ? 'Vận dụng'
              : 'Vận dụng cao';

          // Choose appropriate chapter and lesson targets
          const targetChapter = finalChapters[Math.floor(Math.random() * finalChapters.length)] || finalChapters[0];
          const chapterLessons = targetChapter.lessons || [];
          const activeLessons = chapterLessons.filter(l => selectedLessonIds.includes(l.id));
          const targetLesson = activeLessons.length > 0 
            ? activeLessons[Math.floor(Math.random() * activeLessons.length)]
            : (chapterLessons[0] || null);

          const chapterId = targetChapter.id || 'ch-general';
          const lessonId = targetLesson?.id || 'le-general';
          const topicName = targetLesson ? targetLesson.title : 'Nội dung bồi dưỡng';

          if (sub === 'Toán') {
            if (type === 'MCQ') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'MCQ',
                content: `[Rèn luyện] Cho biểu thức toán học bậc hai hằng số $y = x^2 - ${i + 4}x + ${i * 2 + 4}$. Tìm cực trị hoặc nghiệm thực tương ứng của biểu thức này.`,
                options: [`$x = ${i + 2}$`, `$x = -${i + 2}$`, `$x = 0$`, `$x = 4$`],
                answer: '0',
                explain: 'Phân tích đa thức thành nhân tử $(x-a)(x-b)$ rồi thực hiện cô lập biểu thức tìm nghiệm.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else if (type === 'YESNO') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'YESNO',
                content: `[Rèn luyện] Cho mệnh đề hình học không gian hoặc phương trình lượng giác: "Mọi phương trình $ax + b = 0$ đều có nghiệm duy nhất". Xét tính đúng sai của khẳng định dưới.`,
                options: [
                  'a) Nếu $a = 0$ và $b \\neq 0$, phương trình hoàn toàn vô nghiệm.',
                  'b) Nếu $a \\neq 0$ và $b = 0$, phương trình có nghiệm duy nhất $x = 0$.',
                  'c) Khi $a = b = 0$, phương trình có vô số nghiệm.',
                  'd) Mọi trường hợp hệ số $a, b$ bất kỳ phương trình đều bắt buộc phải có nghiệm thực duy nhất.',
                ],
                answer: 'true,true,true,false',
                explain: 'Nếu hệ số a = 0 thì phương trình trở thành b = 0. Tùy thuộc giá trị b mà phương trình vô nghiệm hoặc vô số nghiệm.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else if (type === 'SHORT') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'SHORT',
                content: `[Rèn luyện] Cho cấp số cộng có số hạng đầu $u_1 = ${i + 1}$ và công sai $d = ${i + 2}$. Tìm trị giá số hạng thứ 3 của cấp số cộng này.`,
                options: [],
                answer: `${i + 1 + 2 * (i + 2)}`,
                explain: 'Áp dụng công thức số hạng tổng quát: $u_n = u_1 + (n-1)d$. Thay số vào: $u_3 = u_1 + 2d$.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'ESSAY',
                content: `[Rèn luyện/Tự luận] Chứng minh rằng biểu thức $A = x^2 - ${i * 2 + 2}x + ${i * i + 2 * i + 2}$ luôn luôn dương với mọi giá trị thực của biến $x$.`,
                options: [],
                answer: 'Sử dụng biến đổi hằng đẳng thức đáng nhớ để viết lại biểu thức dưới dạng bình phương cộng một hằng số dương.',
                explain: 'Biến đổi biểu thức: $A = (x - (i+1))^2 + 1$. Vì $(x - (i+1))^2 \\geq 0 \\Rightarrow A \\geq 1 > 0$ với mọi $x$.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            }
          } else {
            // Tin học
            if (type === 'MCQ') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'MCQ',
                content: `[Đề xuất] Thuật toán tìm kiếm nhị phân (Binary Search) có độ phức tạp thời gian trung bình thuộc nhóm nào sau đây?`,
                options: [`$O(\\log n)$`, `$O(n)$`, `$O(n \\log n)$`, `$O(n^2)$`],
                answer: '0',
                explain: 'Tìm kiếm nhị phân chia đôi dãy tìm kiếm ở mỗi bước nên độ phức tạp là Logarithmic thời gian.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else if (type === 'YESNO') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'YESNO',
                content: `[Đề xuất] Hãy nhận định tính đúng/sai của các thông cáo về hệ nhị phân và hệ đếm trong xử lý phần cứng máy tính:`,
                options: [
                  'a) Hệ nhị phân chỉ sử dụng hai ký tự chữ số là 0 và 1.',
                  'b) Một Byte dữ liệu chuẩn tương đương với 10 bít nhị phân cơ bản.',
                  'c) Hệ thập lục phân (Hexadecimal) hỗ trợ biểu diễn gọn gàng hơn cho các chuỗi nhị phân dài.',
                  'd) RAM mất toàn bộ dữ liệu lưu trữ khi ngắt nguồn điện cấp.',
                ],
                answer: 'true,false,true,true',
                explain: 'Một byte chuẩn tương đương với 8 bit nhị phân chứ không phải 10 bit.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else if (type === 'SHORT') {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'SHORT',
                content: `[Đề xuất] Hãy đổi số thập phân 13 sang hệ nhị phân thuần túy biểu diễn trong máy tính (nhập chuỗi không dấu cách).`,
                options: [],
                answer: '1101',
                explain: 'Chia liên tiếp cho 2 lấy số dư ngược từ dưới lên: 13/2=6 dư 1, 6/2=3 dư 0, 3/2=1 dư 1, 1/2=0 dư 1. Kết quả là 1101.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            } else {
              generatedQs.push({
                id,
                grade,
                subject: sub,
                book: 'Kết nối tri thức',
                chapterId,
                lessonId,
                topic: topicName,
                type: 'ESSAY',
                content: `[Đề xuất/Tự luận] Trình bày nguyên lý hoạt động của kiến trúc Von Neumann và vai trò cụ thể của Bộ nhớ trong máy tính hiện đại.`,
                options: [],
                answer: 'Nêu rõ cấu trúc gồm: CPU (ALU, CU), Bộ nhớ, Thiết bị vào/ra, và nguyên lý lưu trữ chương trình.',
                explain: 'Học sinh cần trình bày đủ 3 thành phần chính của kiến trúc Von Neumann và giải thích cơ chế chu trình Nạp - Giải mã - Thực thi.',
                level,
                source: 'Hệ thống biên soạn',
                status: 'Đã duyệt',
              });
            }
          }
        }
      });

      const allCombined = [...finalSelectedQs, ...generatedQs];
      if (generatedQs.length > 0) {
        onAIQuestionsCreated(generatedQs);
      }

      setGeneratedQPreview(allCombined);

      setTempExam({
        title,
        grade,
        subject: sub,
        book: 'Kết nối tri thức',
        type,
        duration,
        totalScore: totalCalculatedScore,
        questions: allCombined.map((q) => q.id),
        matrix: {
          knowledgeBlocks: newMatrix.map((m) => ({
            title: m.title,
            questionsCount: m.countNb + m.countTh + m.countVd + m.countVdc,
            score: totalCalculatedScore / newMatrix.length,
          })),
        },
        createdBy: 'gv-demo',
      });

      setIsGenerating(false);
    }, 1500);
  };

  const getQuestionPointStyle = (qType: QuestionType) => {
    if (qType === 'MCQ') return qPointMcq;
    if (qType === 'YESNO') return qPointYesNo;
    if (qType === 'SHORT') return qPointShort;
    if (qType === 'ESSAY') return qPointEssay;
    return 0;
  };

  const handleSaveToBankSubmit = () => {
    if (!tempExam) return;
    onSaveExamToBank(tempExam);
    setTempExam(null);
    onNavigate('exam-bank');
  };

  const handleExportTextClick = () => {
    if (!tempExam || generatedQPreview.length === 0) return;

    let txt = `ĐỀ KIỂM TRA ĐA MÔN THCS - THPT\n`;
    txt += `Đề thi: ${tempExam.title}\n`;
    txt += `Môn: ${tempExam.subject} - Lớp: ${tempExam.grade}\n`;
    txt += `Thời gian làm bài: ${tempExam.duration} phút\n`;
    txt += `====================================\n\n`;

    generatedQPreview.forEach((q, idx) => {
      txt += `Câu ${idx + 1}: [${q.level}] ${q.content}\n`;
      if (q.type === 'MCQ') {
        q.options.forEach((opt, oIdx) => {
          txt += `   ${['A', 'B', 'C', 'D'][oIdx]}. ${opt}\n`;
        });
      } else if (q.type === 'YESNO') {
        q.options.forEach((opt, oIdx) => {
          txt += `   ${['a', 'b', 'c', 'd'][oIdx]}. ${opt}\n`;
        });
      }
      txt += `\n`;
    });

    txt += `\n\n====================================\n`;
    txt += `HƯỚNG DẪN GIẢI CHI TIẾT VÀ ĐÁP ÁN CHUẨN\n`;
    txt += `====================================\n`;

    generatedQPreview.forEach((q, idx) => {
      txt += `Câu ${idx + 1} Đáp án đúng: ${q.answer}\n`;
      txt += `Giải thích: ${q.explain}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Kiem_Tra_${tempExam.subject}_Lop${tempExam.grade}.txt`;
    link.click();
  };

  // ==========================================
  // MANUAL EXAM CREATION HANDLERS
  // ==========================================

  // Parser: scans custom syntax structure in line-by-line formatted text
  // Parser: scans custom syntax structure in line-by-line formatted text
  const parseQuestionsFromScript = (rawText: string) => {
    const parsedQs: Question[] = [];
    
    let textBlocks: string[] = [];
    const lowerText = rawText.toLowerCase();
    
    // Check if the text is structured like the user's multi-metadata block format (containing "Môn:")
    if (lowerText.includes('môn:') || lowerText.includes('môn học:')) {
      textBlocks = rawText.split(/(?=(?:^|\n)Môn\s*[:\-])/gi);
    } else {
      textBlocks = rawText.split(/(?=(?:^|\n)Câu\s*\d+\s*[:\.])|(?=(?:^|\n)Câu\s*[:\.])/gi);
    }

    let extractedTitle = manualTitle;
    let extractedSub = manualSub;
    let extractedGrade = manualGrade;
    let extractedDuration = manualDuration;

    // Remove empty/whitespace-only blocks
    textBlocks = textBlocks.map(b => b.trim()).filter(b => b.length > 0);

    for (let idx = 0; idx < textBlocks.length; idx++) {
      const block = textBlocks[idx];
      const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) continue;

      const contentLines: string[] = [];
      const options: string[] = [];
      let answer = '0';
      let explain = '';
      let level: QuestionLevel = 'Thông hiểu';
      let type: QuestionType = 'MCQ';
      let blockChapterName = '';
      let blockLessonName = '';
      let blockSubject = '';
      let blockGrade = '';

      for (let c = 0; c < lines.length; c++) {
        const line = lines[c];

        // 1. Check title/meta on first block or any line
        const titleMatch = line.match(/^(?:Tiêu đề|Đề thi|Tên đề)\s*[:\-]\s*(.+)$/i);
        if (titleMatch) {
          extractedTitle = titleMatch[1].trim();
          continue;
        }

        const subMatch = line.match(/^(?:Môn|Môn học|Subject)\s*[:\-]\s*(.+)$/i);
        if (subMatch) {
          const s = subMatch[1].trim();
          if (s.toLowerCase().includes('toán')) blockSubject = 'Toán';
          else if (s.toLowerCase().includes('tin')) blockSubject = 'Tin học';
          else blockSubject = s;
          extractedSub = blockSubject;
          continue;
        }

        const gradeMatch = line.match(/^(?:Lớp|Khối|Grade)\s*[:\-]\s*(.+)$/i);
        if (gradeMatch) {
          const g = gradeMatch[1].replace(/\D/g, '');
          if (g) blockGrade = g;
          extractedGrade = blockGrade || extractedGrade;
          continue;
        }

        const durationMatch = line.match(/^(?:Thời gian|Số phút)\s*[:\-]\s*(.+)$/i);
        if (durationMatch) {
          const d = durationMatch[1].replace(/\D/g, '');
          if (d) extractedDuration = parseInt(d) || 45;
          continue;
        }

        // 2. Check chapter
        const chMatch = line.match(/^(?:Chương|Chuong|Chủ đề|Chu de|Chapter)\s*[:\-]\s*(.+)$/i) || line.match(/^\[(?:Chương|Chuong|Chủ đề|Chu de|Chapter)\s*[:\-]\s*(.+)\]$/i);
        if (chMatch) {
          blockChapterName = chMatch[1].trim();
          continue;
        }

        // 3. Check lesson/exercise
        const lesMatch = line.match(/^(?:Bài học|Bài|Bài số|Lesson|Bai)\s*[:\-]\s*(.+)$/i) || line.match(/^\[(?:Bài học|Bài|Bài số|Lesson|Bai)\s*[:\-]\s*(.+)\]$/i);
        if (lesMatch) {
          blockLessonName = lesMatch[1].trim();
          continue;
        }

        // 4. Check level
        const lvlMatch = line.match(/^(?:Mức độ nhận thức|Mức độ|Muc do|Level|Mức)\s*[:\-]\s*(.+)$/i) || line.match(/^\[(?:Mức độ nhận thức|Mức độ|Muc do|Level|Mức)\s*[:\-]\s*(.+)\]$/i);
        if (lvlMatch) {
          const lStr = lvlMatch[1].trim().toLowerCase();
          if (lStr.includes('nhận biết') || lStr.includes('nhan biet')) level = 'Nhận biết';
          else if (lStr.includes('thông hiểu') || lStr.includes('thong hieu')) level = 'Thông hiểu';
          else if (lStr.includes('vận dụng cao') || lStr.includes('vdc')) level = 'Vận dụng cao';
          else if (lStr.includes('vận dụng') || lStr.includes('van dung')) level = 'Vận dụng';
          continue;
        }

        // 5. Check type / dạng
        const typeMatch = line.match(/^(?:Dạng|Dang|Type|Hình thức|Hinh thuc)\s*[:\-]\s*(.+)$/i) || line.match(/^\[(?:Dạng|Dang|Type|Hình thức|Hinh thuc)\s*[:\-]\s*(.+)\]$/i);
        if (typeMatch) {
          const tStr = typeMatch[1].trim().toLowerCase();
          if (tStr.includes('mcq') || tStr.includes('trắc nghiệm') || tStr.includes('trac nghiem')) type = 'MCQ';
          else if (tStr.includes('đúng sai') || tStr.includes('yesno') || tStr.includes('đúng/sai') || tStr.includes('tf')) type = 'YESNO';
          else if (tStr.includes('ngắn') || tStr.includes('short') || tStr.includes('trả lời ngắn')) type = 'SHORT';
          else if (tStr.includes('luận') || tStr.includes('tự luận') || tStr.includes('essay')) type = 'ESSAY';
          continue;
        }

        // 6. Check required outcomes to ignore from question content
        const reqMatch = line.match(/^(?:Yêu cầu cần đạt|Yêu cầu|Yccđ|Yccd)\s*[:\-]\s*(.+)$/i);
        if (reqMatch) {
          continue;
        }

        // 7. Match MCQ/YESNO Options: A., B., C., D. or a), b), c), d)
        const optMatch = line.match(/^([A-D]|[a-d])\s*[\.\:\-\)]\s*(.+)$/);
        if (optMatch && (type === 'MCQ' || type === 'YESNO')) {
          options.push(optMatch[2].trim());
          continue;
        }

        // 8. Match Answers
        const ansMatch = line.match(/^(?:Đáp án đúng|Đáp án|Dap an|Key)\s*[:\.=]\s*(.+)$/i);
        if (ansMatch) {
          const rawAns = ansMatch[1].trim();
          if (type === 'MCQ') {
            const cleanAns = rawAns.toUpperCase();
            if (cleanAns === 'A' || cleanAns === '0') answer = '0';
            else if (cleanAns === 'B' || cleanAns === '1') answer = '1';
            else if (cleanAns === 'C' || cleanAns === '2') answer = '2';
            else if (cleanAns === 'D' || cleanAns === '3') answer = '3';
            else answer = rawAns;
          } else if (type === 'YESNO') {
            const parts = rawAns.split(/[\s,;\/\+\|]+/);
            const converted = parts.map(p => {
              const low = p.trim().toLowerCase();
              if (low === 'đúng' || low === 'true' || low === 't' || low === 'd' || low === 'yes') return 'true';
              if (low === 'sai' || low === 'false' || low === 'f' || low === 's' || low === 'no') return 'false';
              return low;
            });
            answer = converted.join(',');
          } else {
            answer = rawAns;
          }
          continue;
        }

        // 9. Match Explanation
        const explainMatch = line.match(/^(?:Lời giải|Giải thích|Hướng dẫn giải|HDG|Loi giai|HD giải|Lời giải chi tiết)\s*[:\.]\s*(.+)$/i);
        if (explainMatch) {
          explain = explainMatch[1].trim();
          for (let next = c + 1; next < lines.length; next++) {
            explain += '\n' + lines[next];
          }
          break; // Eat all remaining rows of this question block as explanation
        }

        // 10. Match explicitly labeled question start
        const contentMatch = line.match(/^(?:Câu|Cau|Đề bài|De bai|Nội dung|Noi dung|Câu hỏi|De|Question|Đề)\s*[:\-]\s*(.+)$/i);
        if (contentMatch) {
          contentLines.push(contentMatch[1].trim());
          continue;
        }

        // Default: If it doesn't match any system metadata fields, treat it as part of the question text body
        contentLines.push(line);
      }

      const cleanContent = contentLines.join('\n').trim();
      if (!cleanContent) continue; // Skip empty metadata block

      // Deduce type automatically if not explicitly provided
      if (type === 'MCQ' && options.length === 0) {
        type = 'SHORT';
      } else if (type === 'MCQ' && options.length === 4) {
        const isTrueFalseContent = /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(cleanContent);
        const isYesNo = isTrueFalseContent || options.every(
          (o) =>
            o.toLowerCase().includes('đúng') ||
            o.toLowerCase().includes('sai') ||
            o.includes('Đúng') ||
            o.includes('Sai')
        );
        if (isYesNo) type = 'YESNO';
      }

      // Match chapter ID or lesson ID in current syllabus dynamically based on text keywords if possible!
      let resolvedChapterId = 'ch-parsed';
      let resolvedLessonId = 'le-parsed';
      let topic = blockLessonName || 'Tự soạn thủ công';

      const targetSub = blockSubject || extractedSub;
      const targetGrade = blockGrade || extractedGrade;
      const activeSyl = syllabus.find((sy) => sy.subject === targetSub && sy.grade === targetGrade);
      if (activeSyl && activeSyl.chapters.length > 0) {
        // Try to match chapterTitle with blockChapterName
        let foundCh = activeSyl.chapters.find((ch) =>
          blockChapterName && ch.title.toLowerCase().includes(blockChapterName.toLowerCase())
        );
        if (!foundCh) {
          foundCh = activeSyl.chapters[0];
        }
        resolvedChapterId = foundCh.id;

        if (foundCh.lessons && foundCh.lessons.length > 0) {
          let foundLes = foundCh.lessons.find((l) =>
            blockLessonName && l.title.toLowerCase().includes(blockLessonName.toLowerCase())
          );
          if (!foundLes) {
            foundLes = foundCh.lessons[0];
          }
          resolvedLessonId = foundLes.id;
          topic = foundLes.title;
        }
      }

      parsedQs.push({
        id: `q-manual-parsed-${Math.floor(Math.random() * 100000)}-${Date.now()}-${idx}`,
        grade: targetGrade,
        subject: targetSub,
        book: 'Kết nối tri thức',
        chapterId: resolvedChapterId,
        lessonId: resolvedLessonId,
        topic,
        type,
        content: cleanContent,
        options: options.length > 0 ? options : (type === 'YESNO' ? ['Đúng', 'Sai', 'Đúng', 'Sai'] : []),
        answer,
        explain: explain || 'Xem tài liệu tự chọn rèn luyện.',
        level,
        source: 'Tự soạn',
        status: 'Đã duyệt',
      });
    }

    return {
      questions: parsedQs,
      extractedTitle,
      extractedSub,
      extractedGrade,
      extractedDuration,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const result = parseQuestionsFromScript(text);
      if (result.questions.length === 0) {
        alert('Không nhận diện được câu hỏi nào hợp lệ! Hãy tải mẫu tham khảo phía dưới.');
        return;
      }

      setManualQuestions(result.questions);
      setManualTitle(result.extractedTitle);
      setManualSub(result.extractedSub);
      setManualGrade(result.extractedGrade);
      setManualDuration(result.extractedDuration);
      setParseStatus(`Đã đọc thành công ${result.questions.length} câu hỏi từ tệp.`);
      alert(`Thêm dữ liệu thành công! Đã nạp ${result.questions.length} câu hỏi vào đề.`);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset input selection
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      alert('Vui lòng kéo thả tệp định dạng văn bản .txt để phân tích.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const result = parseQuestionsFromScript(text);
      if (result.questions.length === 0) {
        alert('Không nhận diện được câu hỏi hợp lệ! Thử tải cấu hình mẫu về xem.');
        return;
      }

      setManualQuestions(result.questions);
      setManualTitle(result.extractedTitle);
      setManualSub(result.extractedSub);
      setManualGrade(result.extractedGrade);
      setManualDuration(result.extractedDuration);
      setParseStatus(`Đã nhận diện thả tệp: ${result.questions.length} câu hỏi.`);
      alert(`Đã nhận diện thành công ${result.questions.length} câu hỏi từ tệp TXT!`);
    };
    reader.readAsText(file);
  };

  const handleAnalyzePasteText = () => {
    if (!pasteText.trim()) {
      alert('Vui lòng dán văn bản đề thi của bạn vào ô phân tích trước!');
      return;
    }

    const result = parseQuestionsFromScript(pasteText);
    if (result.questions.length === 0) {
      alert('Không nhận diện được câu hỏi nào từ phân đoạn bạn dán. Hãy làm khảo định dạng mẫu.');
      return;
    }

    setManualQuestions(result.questions);
    setManualTitle(result.extractedTitle);
    setManualSub(result.extractedSub);
    setManualGrade(result.extractedGrade);
    setManualDuration(result.extractedDuration);
    setParseStatus(`Đã phân tích dán văn bản trực tiếp (${result.questions.length} câu).`);
    setPasteText('');
    alert(`Đã phân tích thành công ${result.questions.length} câu hỏi và tải lên bảng xem trước!`);
  };

  const handleAddOrUpdateManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    const itemObj: Question = {
      id: editingQId || `q-manual-item-${Math.floor(Math.random() * 100000)}-${Date.now()}`,
      grade: manualGrade,
      subject: manualSub,
      book: 'Kết nối tri thức',
      chapterId: 'ch-parsed',
      lessonId: 'le-parsed',
      topic: 'Tự soạn thủ công',
      type: formType,
      content: formContent.trim(),
      options: formType === 'MCQ' || formType === 'YESNO' ? [...formOptions] : [],
      answer: formAnswer,
      explain: formExplain.trim() || 'Xem tài liệu tự soạn rèn luyện.',
      level: formLevel,
      source: 'Giáo viên tự soạn',
      status: 'Đã duyệt',
    };

    if (editingQId) {
      setManualQuestions(manualQuestions.map((q) => (q.id === editingQId ? itemObj : q)));
      setEditingQId(null);
      alert('Đã cập nhật câu hỏi thành công!');
    } else {
      setManualQuestions([...manualQuestions, itemObj]);
      alert('Đã bổ sung thành công câu hỏi vào cấu trúc đề!');
    }

    setFormContent('');
    setFormExplain('');
    setFormOptions(['', '', '', '']);
    setFormAnswer('0');
  };

  const handleEditQuestionClick = (q: Question) => {
    setEditingQId(q.id);
    setFormContent(q.content);
    setFormType(q.type);
    setFormLevel(q.level);
    setFormExplain(q.explain);
    if (q.options && q.options.length > 0) {
      setFormOptions([...q.options]);
    } else {
      setFormOptions(['', '', '', '']);
    }
    setFormAnswer(q.answer);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const list = [...manualQuestions];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    setManualQuestions(list);
  };

  const moveQuestionDown = (index: number) => {
    if (index === manualQuestions.length - 1) return;
    const list = [...manualQuestions];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    setManualQuestions(list);
  };

  const deleteQuestion = (index: number) => {
    if (confirm('Bạn chắc chắn muốn xóa câu hỏi này khỏi đề thi đang soạn?')) {
      setManualQuestions(manualQuestions.filter((_, idx) => idx !== index));
    }
  };

  const handleSaveManualExam = () => {
    if (manualQuestions.length === 0) {
      alert('Đề thi rỗng! Hãy tải đề lên hoặc soạn trước khi lưu.');
      return;
    }

    // Save and register with global banks
    onAIQuestionsCreated(manualQuestions);

    const newExam: Omit<Exam, 'id' | 'createdAt' | 'status'> = {
      title: manualTitle,
      grade: manualGrade,
      subject: manualSub,
      book: 'Kết nối tri thức',
      type: manualType,
      duration: manualDuration,
      totalScore: 10,
      questions: manualQuestions.map((q) => q.id),
      matrix: {
        knowledgeBlocks: [
          {
            title: 'Khung nội dung rèn luyện tự chọn',
            questionsCount: manualQuestions.length,
            score: 10,
          },
        ],
      },
      createdBy: 'gv-demo',
    };

    onSaveExamToBank(newExam);
    alert('Đề tự soạn đã được lưu và đồng bộ thành công vào kho đề chung!');
    onNavigate('exam-bank');
  };

  const handleExportManualTxt = () => {
    if (manualQuestions.length === 0) {
      alert('Đề thi rỗng! Chưa có câu hỏi để xuất.');
      return;
    }

    let txt = `ĐỀ KIỂM TRA TỰ SOẠN THCS - THPT\n`;
    txt += `Đề thi: ${manualTitle}\n`;
    txt += `Môn: ${manualSub} - Lớp: ${manualGrade}\n`;
    txt += `Thời gian làm bài: ${manualDuration} phút\n`;
    txt += `====================================\n\n`;

    manualQuestions.forEach((q, idx) => {
      txt += `Câu ${idx + 1}:\n`;
      txt += `Chương: ${q.chapterId === 'ch-parsed' ? 'Số tự nhiên' : 'Nội dung khác'}\n`;
      txt += `Bài: ${q.topic}\n`;
      txt += `Mức độ: ${q.level}\n`;
      txt += `Dạng: ${q.type === 'MCQ' ? 'Trắc nghiệm khách quan' : q.type === 'YESNO' ? 'Trắc nghiệm đúng sai' : q.type === 'SHORT' ? 'Điền khuyết / Trả lời ngắn' : 'Tự luận'}\n`;
      txt += `Đề bài: ${q.content}\n`;
      if (q.type === 'MCQ' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `   ${['A', 'B', 'C', 'D'][oIdx]}. ${opt}\n`;
        });
      } else if (q.type === 'YESNO' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `   ${['a', 'b', 'c', 'd'][oIdx]}. ${opt}\n`;
        });
      }
      txt += `Đáp án: `;
      let fAns = q.answer;
      if (q.type === 'MCQ') {
        fAns = ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer;
      } else if (q.type === 'YESNO') {
        fAns = q.answer
          .split(',')
          .map((a, i) => `${['a', 'b', 'c', 'd'][i]} (${a === 'true' ? 'Đúng' : 'Sai'})`)
          .join(', ');
      }
      txt += `${fAns}\n`;
      txt += `Lời giải: ${q.explain}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Tu_Soan_${manualSub}_Lop${manualGrade}_Quet.txt`;
    link.click();
  };

  const handleExportManualDocx = () => {
    if (manualQuestions.length === 0) {
      alert('Đề thi rỗng! Chưa có câu hỏi để xuất.');
      return;
    }

    const blob = generateDocxBlob(
      manualTitle,
      manualSub,
      manualGrade,
      manualDuration,
      manualQuestions
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Thi_Equation_Cao_Cap_${manualSub}_Lop${manualGrade}.doc`;
    link.click();
  };

  const handleDownloadTxtTemplate = () => {
    const templateText = `Tiêu đề: ĐỀ THI KHẢO SÁT CHẤT LƯỢNG TOÁN THCS KẾT NỐI TRI THỨC
Môn: Toán
Lớp: 6
Thời gian: 45 phút

Câu 1:
Chương: Số tự nhiên
Bài: Lũy thừa với số mũ tự nhiên
Mức độ: Nhận biết
Dạng: Trắc nghiệm khách quan
Đề bài: Cho phương trình số học tinh giản $3x - 15 = 0$. Giá trị thực nghiệm biến $x$ là gì?
A. $x = 5$
B. $x = -5$
C. $x = 10$
D. $x = 15$
Đáp án: A
Lời giải: Ta giải $3x = 15 \\Leftrightarrow x = 15/3 = 5$ ứng với đáp án A.

Câu 2:
Chương: Hình học trực quan
Bài: Tam giác đều, hình vuông, lục giác đều
Mức độ: Thông hiểu
Dạng: Trắc nghiệm đúng sai
Đề bài: Cho hình lục giác đều $ABCDEF$ tâm $O$. Hãy chọn khẳng định đúng hoặc sai cho các phát biểu dưới đây:
A. Đường chéo chính của lục giác đều luôn song song với nhau.
B. Các góc ở các đỉnh của lục giác đều luôn bằng $120^\\circ$.
C. Sáu tam giác nhỏ được chia bởi ba đường chéo chính là tam giác đều.
D. Độ dài các đường chéo chính gấp ba lần độ dài cạnh lục giác đều.
Đáp án: Sai, Đúng, Đúng, Sai
Lời giải: Các đường chéo chính cắt nhau tại O nên không song song; Độ dài mỗi đường chéo chính bằng 2 lần độ dài cạnh chứ không phải 3 lần.

Câu 3:
Chương: Số tự nhiên
Bài: Thứ tự thực hiện các phép tính
Mức độ: Vận dụng
Dạng: Trả lời ngắn
Đề bài: Cho biểu thức số học sau: $A = 2^3 \\cdot 5 - (3^2 + 1)$. Tính giá trị biểu thức $A$.
Đáp án: 30
Lời giải: Theo quy tắc thứ tự, ta có $A = 8 \\cdot 5 - (9 + 1) = 40 - 10 = 30$.

Câu 4:
Chương: Số tự nhiên
Bài: Ước và bội
Mức độ: Vận dụng cao
Dạng: Tự luận
Đề bài: Một trường THCS tổ chức cho khoảng từ 300 đến 400 học sinh đi dã ngoại bằng xe ô tô. Nếu xếp 30 người hay 45 người lên một xe thì đều vừa đủ. Hỏi trường đó có chính xác bao nhiêu học sinh đi dã ngoại?
Đáp án: 360 học sinh
Lời giải: Gọi số học sinh đi dã ngoại là x (học sinh), với x thuộc tập số tự nhiên và 300 <= x <= 400. Vì xếp 30 người hay 45 người lên một xe đều vừa đủ nên x chia hết cho 30 và x chia hết cho 45. Do đó, x là bội chung của 30 và 45. Ta tìm BCNN(30, 45) = 90. Các bội chung là {0; 90; 180; 270; 360; 450; ...}. Vì 300 <= x <= 400 nên x = 360. Vậy số học sinh đi dã ngoại là 360 học sinh.
`;
    const blob = new Blob([templateText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'De_Thi_Mau_Chuan_Muc_Tieu.txt';
    link.click();
  };

  const handleDownloadDocxTemplate = () => {
    const sampleQs: Question[] = [
      {
        id: 'template-docx-s1',
        grade: '6',
        subject: 'Toán',
        book: 'Kết nối tri thức',
        chapterId: 'temp',
        lessonId: 'temp',
        topic: 'Lũy thừa đại số',
        type: 'MCQ',
        content:
          'Cho đẳng thức hàm số bậc hai rút gọn $x^2 - 10x + 25 = 0$. Tìm giá trị thực của biến để phương trình có hai nghiệm trùng nhau (nghiệm kép).',
        options: ['$x = 5$', '$x = -5$', '$x = 10$', '$x = 0$'],
        answer: '0',
        explain:
          'Ta có phương thức hằng đẳng thức hoàn chỉnh: $x^2 - 10x + 25 = (x - 5)^2 = 0 \\Leftrightarrow x = 5$.',
        level: 'Nhận biết',
        source: 'Mẫu chuẩn',
        status: 'Đã duyệt',
      },
      {
        id: 'template-docx-s2',
        grade: '6',
        subject: 'Toán',
        book: 'Kết nối tri thức',
        chapterId: 'temp',
        lessonId: 'temp',
        topic: 'Rút gọn căn thức',
        type: 'MCQ',
        content:
          'Rút gọn đẳng thức phân số kết hợp toán học cao cấp biểu thị dưới dạng: $A = \\frac{a^2 + b^2}{a+b}$ kết hợp hệ số tỉ lệ căn thức $\\sqrt{ab}$.',
        options: ['$\\frac{a+b}{\\sqrt{ab}}$', '$\\sqrt{ab}$', '$\\frac{a^2 - b^2}{2}$', 'Chưa xác định'],
        answer: '1',
        explain: 'Tiêu biến các mẫu tuần tự thông qua lý thuyết phân dã hằng số kép đặc thù.',
        level: 'Thông hiểu',
        source: 'Mẫu chuẩn',
        status: 'Đã duyệt',
      },
    ];

    const blob = generateDocxBlob(
      'ĐỀ THI MẪU CHUẨN ĐỊNH DẠNG DOCX NATIVE EQUATION',
      'Toán học',
      '6',
      45,
      sampleQs
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'De_Thi_Mau_Math_DOCX_Equation.doc';
    link.click();
  };

  const toggleSelectBankQuestion = (q: Question) => {
    if (selectedBankQuestions.some((item) => item.id === q.id)) {
      setSelectedBankQuestions(selectedBankQuestions.filter((item) => item.id !== q.id));
    } else {
      setSelectedBankQuestions([...selectedBankQuestions, q]);
    }
  };

  const moveBankQuestionUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...selectedBankQuestions];
    const temp = copy[idx];
    copy[idx] = copy[idx - 1];
    copy[idx - 1] = temp;
    setSelectedBankQuestions(copy);
  };

  const moveBankQuestionDown = (idx: number) => {
    if (idx === selectedBankQuestions.length - 1) return;
    const copy = [...selectedBankQuestions];
    const temp = copy[idx];
    copy[idx] = copy[idx + 1];
    copy[idx + 1] = temp;
    setSelectedBankQuestions(copy);
  };

  const removeBankQuestion = (idx: number) => {
    const copy = [...selectedBankQuestions];
    copy.splice(idx, 1);
    setSelectedBankQuestions(copy);
  };

  const handleAutoSelectQuestionsFromBank = () => {
    if (totalCalculatedCount <= 0) {
      alert('Vui lòng thiết lập cấu hình số lượng câu hỏi khác 0 ở bảng "Mục tiêu cơ cấu & Thang điểm" trước!');
      return;
    }

    const uniqueLocalPool = deduplicateQuestions(questions);

    const filtered = uniqueLocalPool.filter((q) => {
      // match subject & grade
      if (q.subject !== bankSub || q.grade !== bankGrade) return false;

      // match selected chapters
      if (bankSelectedChapterIds.length > 0 && !bankSelectedChapterIds.includes(q.chapterId)) {
        return false;
      }
      // match selected lessons
      if (bankSelectedLessonIds.length > 0 && q.lessonId && !bankSelectedLessonIds.includes(q.lessonId)) {
        return false;
      }

      // text match
      if (bankSearch && !q.content.toLowerCase().includes(bankSearch.toLowerCase())) return false;
      // level filter
      if (bankSelectedLevels.length > 0 && !bankSelectedLevels.includes(q.level)) return false;
      if (bankSelectedLevels.length === 0) return false;
      // type filter
      if (bankSelectedTypes.length > 0 && !bankSelectedTypes.includes(q.type)) return false;
      if (bankSelectedTypes.length === 0) return false;
      return true;
    });

    const mcqPool = filtered.filter(q => q.type === 'MCQ');
    const yesnoPool = filtered.filter(q => q.type === 'YESNO');
    const shortPool = filtered.filter(q => q.type === 'SHORT');
    const essayPool = filtered.filter(q => q.type === 'ESSAY');

    const shuffleAndPick = (pool: Question[], n: number): Question[] => {
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const selectedMcq = shuffleAndPick(mcqPool, qCountMcq);
    const selectedYesNo = shuffleAndPick(yesnoPool, qCountYesNo);
    const selectedShort = shuffleAndPick(shortPool, qCountShort);
    const selectedEssay = shuffleAndPick(essayPool, qCountEssay);

    const generatedQs: Question[] = [];
    const types: { type: QuestionType; targetCount: number; selectedList: Question[] }[] = [
      { type: 'MCQ', targetCount: qCountMcq, selectedList: selectedMcq },
      { type: 'YESNO', targetCount: qCountYesNo, selectedList: selectedYesNo },
      { type: 'SHORT', targetCount: qCountShort, selectedList: selectedShort },
      { type: 'ESSAY', targetCount: qCountEssay, selectedList: selectedEssay },
    ];

    const bankSyllabusChapters = bankCurrentChapters.length > 0 ? bankCurrentChapters : [
      { id: 'ch-general', title: 'Khối kiến thức rèn luyện tổng hợp', lessons: [] },
    ];

    types.forEach(({ type, targetCount, selectedList }) => {
      const needed = targetCount - selectedList.length;
      if (needed <= 0) return;

      for (let i = 0; i < needed; i++) {
        const id = `q-bank-gen-${type.toLowerCase()}-${Math.floor(Math.random() * 100000)}`;
        const level: QuestionLevel =
          i % 4 === 0
            ? 'Nhận biết'
            : i % 4 === 1
            ? 'Thông hiểu'
            : i % 4 === 2
            ? 'Vận dụng'
            : 'Vận dụng cao';

        // Choose appropriate chapter and lesson targets
        const targetChapter = bankSyllabusChapters[Math.floor(Math.random() * bankSyllabusChapters.length)] || bankSyllabusChapters[0];
        const chapterLessons = targetChapter.lessons || [];
        const activeLessons = chapterLessons.filter(l => bankSelectedLessonIds.includes(l.id));
        const targetLesson = activeLessons.length > 0 
          ? activeLessons[Math.floor(Math.random() * activeLessons.length)]
          : (chapterLessons[0] || null);

        const chapterId = targetChapter.id || 'ch-general';
        const lessonId = targetLesson?.id || 'le-general';
        const topicName = targetLesson ? targetLesson.title : 'Nội dung bồi dưỡng';

        if (bankSub === 'Toán') {
          if (type === 'MCQ') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'MCQ',
              content: `[Rèn luyện] Cho biểu thức toán học bậc hai hằng số $y = x^2 - ${i + 4}x + ${i * 2 + 4}$. Tìm cực trị hoặc nghiệm thực tương ứng của biểu thức này.`,
              options: [`$x = ${i + 2}$`, `$x = -${i + 2}$`, `$x = 0$`, `$x = 4$`],
              answer: '0',
              explain: 'Phân tích đa thức thành nhân tử $(x-a)(x-b)$ rồi thực hiện cô lập biểu thức tìm nghiệm.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else if (type === 'YESNO') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'YESNO',
              content: `[Rèn luyện] Cho mệnh đề hình học không gian hoặc phương trình lượng giác: "Mọi phương trình $ax + b = 0$ đều có nghiệm duy nhất". Xét tính đúng sai của khẳng định dưới.`,
              options: [
                'a) Nếu $a = 0$ và $b \\neq 0$, phương trình hoàn toàn vô nghiệm.',
                'b) Nếu $a \\neq 0$ và $b = 0$, phương trình có nghiệm duy nhất $x = 0$.',
                'c) Khi $a = b = 0$, phương trình có vô số nghiệm.',
                'd) Mọi trường hợp hệ số $a, b$ bất kỳ phương trình đều bắt buộc phải có nghiệm thực duy nhất.',
              ],
              answer: 'true,true,true,false',
              explain: 'Nếu hệ số a = 0 thì phương trình trở thành b = 0. Tùy thuộc giá trị b mà phương trình vô nghiệm hoặc vô số nghiệm.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else if (type === 'SHORT') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'SHORT',
              content: `[Rèn luyện] Cho cấp số cộng có số hạng đầu $u_1 = ${i + 1}$ và công sai $d = ${i + 2}$. Tìm trị giá số hạng thứ 3 của cấp số cộng này.`,
              options: [],
              answer: `${i + 1 + 2 * (i + 2)}`,
              explain: 'Áp dụng công thức số hạng tổng quát: $u_n = u_1 + (n-1)d$. Thay số vào: $u_3 = u_1 + 2d$.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'ESSAY',
              content: `[Rèn luyện/Tự luận] Chứng minh rằng biểu thức $A = x^2 - ${i * 2 + 2}x + ${i * i + 2 * i + 2}$ luôn luôn dương với mọi giá trị thực của biến $x$.`,
              options: [],
              answer: 'Sử dụng biến đổi hằng đẳng thức đáng nhớ để viết lại biểu thức dưới dạng bình phương cộng một hằng số dương.',
              explain: 'Biến đổi biểu thức: $A = (x - (i+1))^2 + 1$. Vì $(x - (i+1))^2 \\geq 0 \\Rightarrow A \\geq 1 > 0$ với mọi $x$.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          }
        } else {
          // Tin học
          if (type === 'MCQ') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'MCQ',
              content: `[Đề xuất] Thuật toán tìm kiếm nhị phân (Binary Search) có độ phức tạp thời gian trung bình thuộc nhóm nào sau đây?`,
              options: [`$O(\\log n)$`, `$O(n)$`, `$O(n \\log n)$`, `$O(n^2)$`],
              answer: '0',
              explain: 'Tìm kiếm nhị phân chia đôi dãy tìm kiếm ở mỗi bước nên độ phức tạp là Logarithmic thời gian.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else if (type === 'YESNO') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'YESNO',
              content: `[Đề xuất] Hãy nhận định tính đúng/sai của các thông cáo về hệ nhị phân và hệ đếm trong xử lý phần cứng máy tính:`,
              options: [
                'a) Hệ nhị phân chỉ sử dụng hai ký tự chữ số là 0 và 1.',
                'b) Một Byte dữ liệu chuẩn tương đương với 10 bít nhị phân cơ bản.',
                'c) Hệ thập lục phân (Hexadecimal) hỗ trợ biểu diễn gọn gàng hơn cho các chuỗi nhị phân dài.',
                'd) RAM mất toàn bộ dữ liệu lưu trữ khi ngắt nguồn điện cấp.',
              ],
              answer: 'true,false,true,true',
              explain: 'Một byte chuẩn tương đương với 8 bit nhị phân chứ không phải 10 bit.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else if (type === 'SHORT') {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'SHORT',
              content: `[Đề xuất] Hãy đổi số thập phân 13 sang hệ nhị phân thuần túy biểu diễn trong máy tính (nhập chuỗi không dấu cách).`,
              options: [],
              answer: '1101',
              explain: 'Chia liên tiếp cho 2 lấy số dư ngược từ dưới lên: 13/2=6 dư 1, 6/2=3 dư 0, 3/2=1 dư 1, 1/2=0 dư 1. Kết quả là 1101.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          } else {
            generatedQs.push({
              id,
              grade: bankGrade,
              subject: bankSub,
              book: 'Kết nối tri thức',
              chapterId,
              lessonId,
              topic: topicName,
              type: 'ESSAY',
              content: `[Đề xuất/Tự luận] Trình bày nguyên lý hoạt động của kiến trúc Von Neumann và vai trò cụ thể của Bộ nhớ trong máy tính hiện đại.`,
              options: [],
              answer: 'Nêu rõ cấu trúc gồm: CPU (ALU, CU), Bộ nhớ, Thiết bị vào/ra, và nguyên lý lưu trữ chương trình.',
              explain: 'Học sinh cần trình bày đủ 3 thành phần chính của kiến trúc Von Neumann và giải thích cơ chế chu trình Nạp - Giải mã - Thực thi.',
              level,
              source: 'Hệ thống biên soạn',
              status: 'Đã duyệt',
            });
          }
        }
      }
    });

    if (generatedQs.length > 0) {
      onAIQuestionsCreated(generatedQs);
    }

    const combined = [...selectedMcq, ...selectedYesNo, ...selectedShort, ...selectedEssay, ...generatedQs];

    setSelectedBankQuestions(combined);
    
    let notif = `Đã tự động chọn thành công ${combined.length} câu hỏi phù hợp vào Đề thi đang biên soạn:\n`;
    notif += `• Trắc nghiệm MCQ: ${selectedMcq.length + generatedQs.filter(q => q.type === 'MCQ').length}/${qCountMcq} câu\n`;
    notif += `• Đúng / Sai: ${selectedYesNo.length + generatedQs.filter(q => q.type === 'YESNO').length}/${qCountYesNo} câu\n`;
    notif += `• Trả lời ngắn: ${selectedShort.length + generatedQs.filter(q => q.type === 'SHORT').length}/${qCountShort} câu\n`;
    notif += `• Tự luận: ${selectedEssay.length + generatedQs.filter(q => q.type === 'ESSAY').length}/${qCountEssay} câu\n`;
    
    if (generatedQs.length > 0) {
      notif += `\n(Hệ thống đã tự động bù đắp ${generatedQs.length} câu hỏi còn thiếu từ ngân hàng đề biên soạn cốt lõi!)`;
    }
    
    alert(notif);
  };

  const handleSaveBankExam = () => {
    if (selectedBankQuestions.length === 0) {
      alert('Đề thi rỗng! Vui lòng chọn ít nhất 1 câu hỏi từ kho.');
      return;
    }

    onSaveExamToBank({
      title: bankTitle,
      grade: bankGrade,
      subject: bankSub,
      book: 'Kết nối tri thức',
      type: bankType,
      duration: bankDuration,
      totalScore: totalCalculatedScore,
      questions: selectedBankQuestions.map((q) => q.id),
      matrix: {
        knowledgeBlocks: [
          {
            title: 'Khối câu hỏi biên soạn tinh tuyển',
            questionsCount: selectedBankQuestions.length,
            score: totalCalculatedScore,
          },
        ],
      },
      createdBy: 'gv-demo',
    });

    // Clear and navigate
    setSelectedBankQuestions([]);
    onNavigate('exam-bank');
  };

  const handleExportBankTxt = () => {
    if (selectedBankQuestions.length === 0) {
      alert('Đề thi đang trống!');
      return;
    }

    let txt = `ĐỀ THI BIÊN SOẠN TỪ KHO CÂU HỎI CHUYÊN NGHIỆP\n`;
    txt += `Đề thi: ${bankTitle}\n`;
    txt += `Môn: ${bankSub} - Lớp: ${bankGrade}\n`;
    txt += `Thời gian làm bài: ${bankDuration} phút - Thang điểm thiết lập: ${totalCalculatedScore}đ\n`;
    txt += `====================================\n\n`;

    selectedBankQuestions.forEach((q, idx) => {
      txt += `Câu ${idx + 1} [${q.level || 'Thông hiểu'}] [${q.type || 'MCQ'}]: ${q.content}\n`;
      if (q.type === 'MCQ' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `  ${['A', 'B', 'C', 'D'][oIdx]}. ${opt}\n`;
        });
      } else if (q.type === 'YESNO' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `  ${['a', 'b', 'c', 'd'][oIdx]}. ${opt}\n`;
        });
      }
      txt += `\n`;
    });

    txt += `\n====================================\n`;
    txt += `HƯỚNG DẪN GIẢI CHI TIẾT VÀ ĐÁP ÁN CHUẨN\n`;
    txt += `====================================\n`;

    selectedBankQuestions.forEach((q, idx) => {
      let fAns = q.answer;
      if (q.type === 'MCQ') {
        fAns = ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer;
      } else if (q.type === 'YESNO') {
        fAns = q.answer
          .split(',')
          .map((a, i) => `${['a', 'b', 'c', 'd'][i]} (${a === 'true' ? 'Đúng' : 'Sai'})`)
          .join(', ');
      }
      txt += `Câu ${idx + 1} Đáp án đúng: ${fAns}\n`;
      txt += `Giải thích: ${q.explain}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Biens_Soan_Kho_${bankSub}_Lop${bankGrade}.txt`;
    link.click();
  };

  const handleExportBankDocx = () => {
    if (selectedBankQuestions.length === 0) {
      alert('Đề thi rỗng!');
      return;
    }

    const blob = generateDocxBlob(
      bankTitle,
      bankSub,
      bankGrade,
      bankDuration,
      selectedBankQuestions
    );
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Docx_Kho_Cau_Hoi_${bankSub}_Lop${bankGrade}.doc`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Module Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </span>
            Ma trận & Biên soạn Đề thi
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Thiết kế ma trận đề thi định kỳ (CV 7991), nạp cấu trúc chương trình sẵn có, hoặc tự biên soạn thủ công & định dạng Equation chuẩn.
          </p>
        </div>

        {/* Tab Selection Switches */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto max-w-2xl self-center">
          <button
            type="button"
            onClick={() => setCreationMode('matrix')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              creationMode === 'matrix'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Xây dựng Ma trận đề
          </button>
          <button
            type="button"
            onClick={() => setCreationMode('manual')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              creationMode === 'manual'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            Biên soạn Thủ công (TXT / Word)
          </button>
          <button
            type="button"
            onClick={() => setCreationMode('fromBank')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              creationMode === 'fromBank'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            Biên soạn đề từ Kho câu hỏi
          </button>
        </div>
      </div>

      {/* ==========================================
          MODE 1: AUTOMATED MATRIX CREATION (AI)
          ========================================== */}
      {creationMode === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam parameters configuration column */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-zinc-100 pb-2">Thông số đề rèn luyện</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Môn học</label>
              <select
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Toán">Toán học</option>
                <option value="Tin học">Tin học</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lớp</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dạng thi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="kiểm tra thường xuyên">Thường xuyên (15p)</option>
                  <option value="giữa kỳ">Giữa kỳ (45p)</option>
                  <option value="cuối kỳ">Cuối kỳ (90p)</option>
                  <option value="ôn tập">Khác / Ôn tập tự do</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên tiêu đề Đề thi</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Đề kiểm tra ôn tập chuẩn mực..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số phút</label>
                <input
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thang điểm mục tiêu</label>
                <input
                  type="text"
                  readOnly
                  value="10.0đ"
                  className="w-full text-sm bg-slate-100 border border-slate-200 rounded-lg p-2 focus:ring-none outline-none font-bold text-center text-slate-500"
                />
              </div>
            </div>

            {/* LỰA CHỌN CHƯƠNG, BÀI */}
            <div className="space-y-2 border-t pt-3 border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Chọn Chương và Bài học
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const activeSyl = syllabus.find((sy) => sy.subject === sub && sy.grade === grade);
                      if (activeSyl) {
                        setSelectedChapterIds(activeSyl.chapters.map(c => c.id));
                        const lesIds: string[] = [];
                        activeSyl.chapters.forEach(c => c.lessons.forEach(l => lesIds.push(l.id)));
                        setSelectedLessonIds(lesIds);
                      }
                    }}
                    className="text-[9px] font-black text-emerald-600 hover:underline bg-none border-none cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-[9px] text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChapterIds([]);
                      setSelectedLessonIds([]);
                    }}
                    className="text-[9px] font-black text-rose-500 hover:underline bg-none border-none cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {currentChapters.length > 0 ? (
                <div className="max-h-[180px] overflow-y-auto border border-slate-150 rounded-lg p-2.5 space-y-3 bg-slate-50 custom-scrollbar">
                  {currentChapters.map((ch) => {
                    const isChapterSelected = selectedChapterIds.includes(ch.id);
                    const chapterLessons = ch.lessons || [];

                    return (
                      <div key={ch.id} className="space-y-1 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                        {/* Chapter row selector */}
                        <div className="flex items-start gap-2">
                          <input
                            id={`ch-select-${ch.id}`}
                            type="checkbox"
                            checked={isChapterSelected}
                            onChange={() => {
                              if (isChapterSelected) {
                                setSelectedChapterIds(selectedChapterIds.filter(id => id !== ch.id));
                                const lesIdsToKeep = selectedLessonIds.filter(id => !chapterLessons.some(l => l.id === id));
                                setSelectedLessonIds(lesIdsToKeep);
                              } else {
                                setSelectedChapterIds([...selectedChapterIds, ch.id]);
                                const lesIdsToAdd = chapterLessons.map(l => l.id).filter(id => !selectedLessonIds.includes(id));
                                setSelectedLessonIds([...selectedLessonIds, ...lesIdsToAdd]);
                              }
                            }}
                            className="rounded text-emerald-500 focus:ring-emerald-500 mt-0.5"
                          />
                          <label htmlFor={`ch-select-${ch.id}`} className="text-xs font-bold text-slate-800 leading-tight cursor-pointer">
                            {ch.title}
                          </label>
                        </div>

                        {/* Lessons checkbox list */}
                        {chapterLessons.length > 0 && (
                          <div className="pl-5 space-y-1 border-l-2 border-slate-200 ml-1.5 mt-1">
                            {chapterLessons.map((les) => {
                              const isLessonSelected = selectedLessonIds.includes(les.id);
                              return (
                                <div key={les.id} className="flex items-start gap-2">
                                  <input
                                    id={`les-select-${les.id}`}
                                    type="checkbox"
                                    checked={isLessonSelected}
                                    onChange={() => {
                                      if (isLessonSelected) {
                                        setSelectedLessonIds(selectedLessonIds.filter(id => id !== les.id));
                                      } else {
                                        setSelectedLessonIds([...selectedLessonIds, les.id]);
                                        if (!isChapterSelected) {
                                          setSelectedChapterIds([...selectedChapterIds, ch.id]);
                                        }
                                      }
                                    }}
                                    className="rounded text-emerald-500 focus:ring-emerald-500 mt-0.5"
                                  />
                                  <label htmlFor={`les-select-${les.id}`} className="text-[11px] text-slate-600 font-medium leading-tight cursor-pointer">
                                    {les.title}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Môn học và Khối lớp này chưa đăng ký chi tiết học liệu dạng chương bài.</p>
              )}
            </div>

            {/* Custom Configuration for Question Types & Scores */}
            {renderTypeConfigControls()}

            {/* Cognitive proportions inputs */}
            <div className="space-y-2 border-t pt-2 border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase">Tỷ lệ mức độ nhận thức (%)</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  Nhận biết:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pctNb}
                    onChange={(e) => setPctNb(parseInt(e.target.value) || 0)}
                    className="w-full p-1.5 border rounded bg-slate-50 text-center focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                  />
                </div>
                <div>
                  Thông hiểu:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pctTh}
                    onChange={(e) => setPctTh(parseInt(e.target.value) || 0)}
                    className="w-full p-1.5 border rounded bg-slate-50 text-center focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                  />
                </div>
                <div>
                  Vận dụng:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pctVd}
                    onChange={(e) => setPctVd(parseInt(e.target.value) || 0)}
                    className="w-full p-1.5 border rounded bg-slate-50 text-center focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                  />
                </div>
                <div>
                  Cực nâng cao:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pctVdc}
                    onChange={(e) => setPctVdc(parseInt(e.target.value) || 0)}
                    className="w-full p-1.5 border rounded bg-slate-50 text-center focus:ring-2 focus:ring-emerald-500 outline-none mt-0.5"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 italic text-right">Tổng tỷ trọng: {pctNb + pctTh + pctVd + pctVdc}%</p>
            </div>

            <div className="space-y-1.5 border-t pt-2 border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase">Dạng câu hỏi hỗ trợ</label>
              <div className="space-y-1 text-xs font-medium text-slate-600">
                {(['MCQ', 'YESNO', 'SHORT', 'ESSAY'] as QuestionType[]).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={typesSelected.includes(t)}
                      onChange={() => toggleTypeSelected(t)}
                      className="rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      {t === 'MCQ'
                        ? 'Trắc nghiệm MCQ 4 lựa chọn'
                        : t === 'YESNO'
                        ? 'Trắc nghiệm Đúng/Sai 4 ý'
                        : t === 'SHORT'
                        ? 'Điền khuyết / Trả lời ngắn'
                        : 'Tự luận sư phạm'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateExamSubmit}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-bounce" />
              {isGenerating ? 'Đang biên soạn ma trận...' : 'TẠO ĐỀ THI THEO MA TRẬN'}
            </button>
          </div>

          {/* Matrix blueprint & live generated exam preview col */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">Ma trận đề thi đề xuất (Công văn 7991)</h3>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-lg uppercase">
                Quy chuẩn kiểm định chất lượng
              </span>
            </div>

            {matrixData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500 border border-slate-100">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b">
                    <tr>
                      <th className="px-3 py-2 border-r">Khối kiến thức / Chương</th>
                      <th className="px-3 py-2 border-r text-center">Nhận biết</th>
                      <th className="px-3 py-2 border-r text-center">Thông hiểu</th>
                      <th className="px-3 py-2 border-r text-center">Vận dụng</th>
                      <th className="px-3 py-2 text-center font-bold">Nâng cao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                    {matrixData.map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2.5 border-r font-bold text-slate-700">{row.title}</td>
                        <td className="px-3 py-2.5 border-r text-center">{row.countNb} câu</td>
                        <td className="px-3 py-2.5 border-r text-center">{row.countTh} câu</td>
                        <td className="px-3 py-2.5 border-r text-center">{row.countVd} câu</td>
                        <td className="px-3 py-2.5 text-center">{row.countVdc} câu</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t">
                      <td className="px-3 py-2.5 border-r">Tổng số câu hỏi</td>
                      <td className="px-3 py-2.5 text-center" colSpan={4}>
                        {totalCalculatedCount} câu hỏi rèn luyện chuẩn mực đã được xếp vị trí ma trận
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                Vui lòng thiết lập cấu hình đề ở bên trái và bấm nút "TẠO ĐỀ THI THEO MA TRẬN" để xuất cấu trúc đề thi.
              </div>
            )}

            {/* Generated Exam Preview block */}
            {tempExam && generatedQPreview.length > 0 && (
              <div className="space-y-4 border-t pt-6 border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h4 className="font-bold text-slate-800 text-sm">Xem trước: Đề thi định dạng chuẩn</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToBankSubmit}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu vào kho đề
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTextClick}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất tệp TXT
                    </button>
                  </div>
                </div>

                <div className="border rounded-xl p-5 bg-white space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {generatedQPreview.map((q, idx) => (
                    <div key={q.id} className="space-y-3 pb-5 border-b border-slate-100 last:border-none last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase mr-2 font-black">
                            {q.level}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            Câu {idx + 1} ({q.type})
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-emerald-600 font-black">Định lượng: {getQuestionPointStyle(q.type)}đ</span>
                          <button
                            type="button"
                            onClick={() => handleSwapMatrixQuestion(idx)}
                            className="flex items-center gap-1 text-[10px] font-extrabold text-blue-650 bg-blue-50/50 border border-blue-150 px-2 py-0.5 rounded hover:bg-blue-100/70 transition-colors cursor-pointer"
                            title="Đổi câu hỏi khác phù hợp hơn"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-500 animate-none" />
                            Đổi câu
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        <MathText text={q.content} />
                      </p>

                      {q.type === 'MCQ' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {q.options.slice(0, 4).map((opt, oIdx) => (
                            <div key={oIdx} className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <strong className="text-slate-800">{['A', 'B', 'C', 'D'][oIdx]}.</strong> <MathText text={opt} />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'YESNO' && (
                        <div className="space-y-2 mt-2">
                          {q.options.slice(0, 4).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between"
                            >
                              <span>
                                <strong className="text-slate-800">{['a', 'b', 'c', 'd'][oIdx]})</strong> <MathText text={opt} />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Mệnh đề Đúng / Sai</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Solutions walkthrough */}
                      <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-lg text-xs mt-2 space-y-1">
                        <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Lời giải và đáp án chuẩn:
                        </p>
                        <p className="text-slate-700">
                          <strong>Đáp án chuẩn:</strong>{' '}
                          {q.type === 'YESNO'
                            ? q.answer
                                .split(',')
                                .map((aStr, aIdx) => `${['a', 'b', 'c', 'd'][aIdx]} (${aStr === 'true' ? 'Đúng' : 'Sai'})`)
                                .join(', ')
                            : q.type === 'MCQ'
                            ? ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer
                            : q.answer}
                        </p>
                        <p className="text-slate-500 italic mt-1 font-semibold leading-relaxed">
                          <MathText text={q.explain} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODE 2: PREMIUM MANUAL EXAM BUILDER
          ========================================== */}
      {creationMode === 'manual' && (
        <div className="space-y-6">
          {/* Section banner metadata edit area */}
          <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 p-5 rounded-2xl border border-emerald-100/50 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Tiêu đề đề thi tự biên soạn
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nhập tiêu đề hoặc quét tiêu đề mẫu..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Môn học & Khối học
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={manualSub}
                  onChange={(e) => setManualSub(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-y focus:ring-emerald-500"
                >
                  <option value="Toán">Toán Học</option>
                  <option value="Tin học">Tin Học</option>
                </select>
                <select
                  value={manualGrade}
                  onChange={(e) => setManualGrade(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-y focus:ring-emerald-500"
                >
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Thời lượng & Hình thức
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2 border rounded-xl">
                  <input
                    type="number"
                    min={5}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(parseInt(e.target.value) || 45)}
                    className="w-full text-xs font-black text-center outline-none border-none py-2"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">phút</span>
                </div>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-y focus:ring-emerald-500"
                >
                  <option value="ôn tập">Ôn tập</option>
                  <option value="giữa kỳ">Giữa kỳ</option>
                  <option value="cuối kỳ">Cuối kỳ</option>
                  <option value="kiểm tra thường xuyên">15 phút</option>
                </select>
              </div>
            </div>
          </div>

          {/* Two Columns Manual Creators Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column: Import and Forms Builder (span 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question count & points config */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
                  <Clipboard className="w-4 h-4 text-indigo-600" />
                  Cấu hình Số câu & Điểm mục tiêu
                </h3>
                {renderTypeConfigControls()}
              </div>

              {/* File Upload drag-drop and Templates Block */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Nạp đề có sẵn & Bản mẫu chuẩn
                </h3>

                {/* Templates Downloader segment */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-dashed border-slate-100">
                  <button
                    type="button"
                    onClick={handleDownloadTxtTemplate}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors flex flex-col gap-1 cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                      Đề Mẫu Dạng TXT
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">Quét nén cấu trúc 1s</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDocxTemplate}
                    className="p-3 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-100 text-left transition-colors flex flex-col gap-1 cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
                      Mẫu Đề Word Math
                    </span>
                    <span className="text-[9px] text-emerald-600/80 font-bold">Chứa Equation chuẩn</span>
                  </button>
                </div>

                {/* Drag and Drop Container */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/40 scale-95 shadow-inner'
                      : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-700">Kéo & Thả tệp .TXT của bạn tại đây</p>
                    <p className="text-[10px] text-slate-450 font-bold">Hoặc nhấp chuột để tìm file trong máy tính của bạn</p>
                  </div>
                </div>

                {/* Instant paste string block converter */}
                <div className="space-y-2 pt-2">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    Dán nhanh văn bản hoặc nháp đề:
                  </label>
                  <textarea
                    rows={4}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Mẹo dán:&#10;Câu 1: [Nhận biết] Cho phương trình $x + 2 = 5$. Tìm x...&#10;A. x = 3&#10;B. x = 5...&#10;Đáp án: A"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzePasteText}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[11px] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Quét phân tích nhanh dòng văn bản
                  </button>
                  {parseStatus && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{parseStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Single Question Builder Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingQId ? 'Cập nhật câu hỏi chỉnh sửa' : 'Thêm câu hỏi rèn luyện đơn'}
                  </h3>
                  {editingQId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQId(null);
                        setFormContent('');
                        setFormExplain('');
                        setFormOptions(['', '', '', '']);
                        setFormAnswer('0');
                      }}
                      className="text-[10px] bg-amber-50 text-amber-700 font-extrabold hover:bg-amber-100 rounded px-2 py-0.5"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddOrUpdateManualQuestion} className="space-y-4 text-xs font-bold">
                  {/* Content textarea */}
                  <div>
                    <label className="block text-slate-500 mb-1">NỘI DUNG CÂU HỎI (Hỗ trợ LaTeX $...$ ví dụ $x^2 + 5x$)</label>
                    <textarea
                      rows={3}
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Nhập đề bài rèn luyện..."
                      className="w-full bg-slate-50 text-xs font-semibold border border-slate-250 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Level and Type switches */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">MỨC ĐỘ NHẬN THỨC</label>
                      <select
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value as QuestionLevel)}
                        className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="Nhận biết">Nhận biết</option>
                        <option value="Thông hiểu">Thông hiểu</option>
                        <option value="Vận dụng">Vận dụng</option>
                        <option value="Vận dụng cao">Vận dụng cao</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">DẠNG THỨC CÂU HỎI</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value as QuestionType)}
                        className="w-full bg-slate-50 text-xs border border-slate-200 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="MCQ">Trắc nghiệm dạng MCQ</option>
                        <option value="YESNO">Đúng/Sai 4 mệnh đề</option>
                        <option value="SHORT">Trả lời ngắn</option>
                        <option value="ESSAY">Tự luận sư phạm</option>
                      </select>
                    </div>
                  </div>

                  {/* MCQ / YESNO options fields */}
                  {(formType === 'MCQ' || formType === 'YESNO') && (
                    <div className="space-y-2.5 border-t pt-3 border-slate-100">
                      <label className="block text-emerald-600 font-extrabold uppercase text-[10px]">
                        Xác lập {formType === 'MCQ' ? 'Các lựa chọn đáp án (MCQ)' : '4 mệnh đề (Đúng / Sai)'}
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {formOptions.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 border text-indigo-750 font-black text-xs flex items-center justify-center shrink-0">
                              {['A', 'B', 'C', 'D'][oIdx]}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const copy = [...formOptions];
                                copy[oIdx] = e.target.value;
                                setFormOptions(copy);
                              }}
                              placeholder={
                                formType === 'MCQ'
                                  ? `Nhập phương án ${['A', 'B', 'C', 'D'][oIdx]}...`
                                  : `Nhập mệnh đề phát biểu ý thứ ${['a', 'b', 'c', 'd'][oIdx]}...`
                              }
                              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answers input switcher */}
                  <div className="border-t pt-3 border-slate-100">
                    <label className="block text-slate-500 mb-1 uppercase text-[10px]">ĐÁP ÁN CHÍNH XÁC</label>
                    {formType === 'MCQ' ? (
                      <div className="grid grid-cols-4 gap-2">
                        {['A', 'B', 'C', 'D'].map((lbl, idx) => (
                          <button
                            type="button"
                            key={lbl}
                            onClick={() => setFormAnswer(idx.toString())}
                            className={`p-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                              formAnswer === idx.toString()
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Lựa chọn {lbl}
                          </button>
                        ))}
                      </div>
                    ) : formType === 'YESNO' ? (
                      <div className="space-y-2">
                        <span className="text-[10px] text-zinc-400 block italic mb-1">
                          Lưu trữ dạng chuỗi trạng thái ví dụ: true,false,true,true (Tương đương: Đúng, Sai, Đúng, Đúng)
                        </span>
                        <input
                          type="text"
                          value={formAnswer}
                          onChange={(e) => setFormAnswer(e.target.value)}
                          placeholder="Nhập: true,false,true,true"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formAnswer}
                        onChange={(e) => setFormAnswer(e.target.value)}
                        placeholder="Nhập kết quả điền khuyết..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>

                  {/* Explanation feedback */}
                  <div>
                    <label className="block text-slate-500 mb-1">DẪN GIẢI / LỜI GIẢI CHI TIẾT</label>
                    <textarea
                      rows={2.5}
                      value={formExplain}
                      onChange={(e) => setFormExplain(e.target.value)}
                      placeholder="Nhập giải trình lý thuyết..."
                      className="w-full bg-slate-50 text-xs font-semibold border border-slate-200 rounded-xl p-2 outline-none"
                    />
                  </div>

                  {/* Add action */}
                  <button
                    type="submit"
                    className={`w-full py-2.5 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                      editingQId
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {editingQId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingQId ? 'XÁC NHẬN CẬP NHẬT CÂU HỎI' : 'THÊM NGAY CÂU HỎI'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Previews, Reorganizers and Standard exporters (span 3) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Floating controls panel header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Tổng quan cấu trúc Đề tự soạn
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Chứa tất cả các chỉnh sửa tạm thời trong bộ nhớ cache cục bộ.
                    </p>
                  </div>
                  <span className="self-start sm:self-center bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-xs font-black shrink-0">
                    Mã đề rèn luyện: {manualQuestions.length} câu
                  </span>
                </div>

                {/* Exporter Dashboard Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveManualExam}
                      disabled={manualQuestions.length === 0}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Lưu & Đồng bộ Kho chung
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportManualTxt}
                      disabled={manualQuestions.length === 0}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export TXT
                    </button>
                    <button
                      type="button"
                      onClick={handleExportManualDocx}
                      disabled={manualQuestions.length === 0}
                      className="px-3 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-100" />
                      XUẤT ĐỀ WORD (.doc)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Bạn chắc chắn muốn xóa rỗng toàn bộ câu hỏi đang biên soạn?')) {
                          setManualQuestions([]);
                        }
                      }}
                      disabled={manualQuestions.length === 0}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 cursor-pointer disabled:opacity-50"
                      title="Xóa hết"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editable Question lists Feed */}
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden p-5 space-y-4 max-h-[750px] overflow-y-auto custom-scrollbar">
                {/* Real-time Validation Warn Bar */}
                {(() => {
                  const allErrors: { idx: number; text: string }[] = [];
                  manualQuestions.forEach((q, idx) => {
                    const isTrueFalseContent = /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(q.content || '');
                    if (q.type === 'MCQ') {
                      if (isTrueFalseContent) {
                        allErrors.push({
                          idx,
                          text: `Câu ${idx + 1}: Yêu cầu "Xác định tính Đúng/Sai" không phù hợp với dạng Trắc nghiệm một lựa chọn (MCQ). Vui lòng chuyển dạng sang "Đúng/Sai" (YESNO).`
                        });
                      }
                      const hasExplainInOpts = q.options && q.options.some((o: string) => /^(?:Đúng|Sai|True|False)\s*[:\-]/i.test(o) || /^\.?\s*(?:Đúng|Sai)\s*[:\-]/i.test(o));
                      if (hasExplainInOpts || (q.options && q.options.length > 4)) {
                        allErrors.push({
                          idx,
                          text: `Câu ${idx + 1}: Chứa phần giải thích "Đúng/Sai: ..." trong phương án lựa chọn (hoặc có nhiều hơn 4 lựa chọn).`
                        });
                      }
                    }
                  });

                  if (allErrors.length > 0) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-amber-800 flex items-center gap-1.5 text-xs">
                              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse inline-block"></span>
                              Phát hiện {allErrors.length} điểm bất thường trong thiết lập câu hỏi MCQ:
                            </p>
                            <p className="text-[11px] text-amber-600 mt-0.5">Hệ thống khuyến nghị sửa đổi cách hỏi và chuyển đổi sang dạng Đúng/Sai (YESNO) tương ứng để học sinh có thể tích chọn cho từng mệnh đề độc lập.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const fixed = manualQuestions.map((q) => {
                                let updated = { ...q };
                                const isTrueFalseContent = /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(updated.content || '');
                                if (updated.type === 'MCQ' && isTrueFalseContent) {
                                  updated.type = 'YESNO';
                                }
                                if (updated.options && updated.options.length > 0) {
                                  const standardOptions: string[] = [];
                                  const explanationsFound: string[] = [];
                                  updated.options.forEach((opt: string) => {
                                    const cleanOpt = opt.trim();
                                    if (/^(?:Đúng|Sai|True|False)\s*[:\-]/i.test(cleanOpt) || /^\.?\s*(?:Đúng|Sai)\s*[:\-]/i.test(cleanOpt)) {
                                      explanationsFound.push(cleanOpt);
                                    } else {
                                      standardOptions.push(cleanOpt);
                                    }
                                  });
                                  if (explanationsFound.length > 0) {
                                    updated.options = standardOptions;
                                    const extraExplainText = explanationsFound.join('\n');
                                    updated.explain = updated.explain && updated.explain !== 'Xem tài liệu tự chọn rèn luyện.'
                                      ? `${updated.explain}\n\n${extraExplainText}`
                                      : extraExplainText;
                                  }
                                }
                                if (updated.type === 'MCQ' && updated.options && updated.options.length > 4) {
                                  const extraOpts = updated.options.slice(4);
                                  updated.options = updated.options.slice(0, 4);
                                  const extraExplainText = extraOpts.map((o: string) => `. ${o}`).join('\n');
                                  updated.explain = updated.explain && updated.explain !== 'Xem tài liệu tự chọn rèn luyện.'
                                    ? `${updated.explain}\n\n${extraExplainText}`
                                    : extraExplainText;
                                }
                                return updated;
                              });
                              setManualQuestions(fixed);
                              alert('Đã tự động tối ưu hóa: Sàng lọc sạch sẽ các dòng giải thích trong phương án của giáo viên và chuyển đổi dạng câu hỏi MCQ có câu lệnh Đúng/Sai sang dạng Đúng/Sai (YESNO) chuẩn mực!');
                            }}
                            className="bg-amber-650 hover:bg-amber-700 text-white font-black px-3 py-1.5 rounded-xl shadow-sm cursor-pointer transition-all uppercase tracking-wider text-[10px] shrink-0 self-start sm:self-center"
                          >
                            Tự động Sửa lỗi & Tối ưu MCQ
                          </button>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-amber-700 font-semibold text-[11px]">
                          {allErrors.map((err, eIdx) => (
                            <li key={eIdx}>{err.text}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}

                {manualQuestions.length > 0 ? (
                  <div className="divide-y divide-slate-100 space-y-4">
                    {manualQuestions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="space-y-3 pt-4 first:pt-0 pb-2 border-b border-slate-50 last:border-0 last:pb-0"
                      >
                        {/* Feed Card Controls and headers */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-slate-600 uppercase">
                              {q.level || 'Thông hiểu'}
                            </span>
                            <span className="text-xs font-black text-slate-800">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-bold">
                              ({q.type === 'MCQ' ? 'Trắc nghiệm' : q.type === 'YESNO' ? 'Đúng/Sai' : 'Tự luận'})
                            </span>
                          </div>

                          {/* Reorganization layout switches */}
                          <div className="flex items-center gap-1 shadow-sm rounded-lg bg-slate-50 border p-1">
                            <button
                              type="button"
                              onClick={() => moveQuestionUp(idx)}
                              disabled={idx === 0}
                              className="p-1 hover:bg-white text-slate-500 rounded disabled:opacity-20 cursor-pointer"
                              title="Chuyển lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestionDown(idx)}
                              disabled={idx === manualQuestions.length - 1}
                              className="p-1 hover:bg-white text-slate-500 rounded disabled:opacity-20 cursor-pointer"
                              title="Chuyển xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditQuestionClick(q)}
                              className="p-1 text-indigo-600 hover:bg-white rounded cursor-pointer"
                              title="Chỉnh sửa câu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(idx)}
                              className="p-1 text-rose-600 hover:bg-white rounded cursor-pointer"
                              title="Xóa câu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive KaTeX enabled Render Section */}
                        <div className="text-sm font-semibold text-slate-800 leading-relaxed pl-1.5 border-l-2 border-emerald-400">
                          <MathText text={q.content} />
                        </div>

                        {/* Visual Choice Lists options rendering */}
                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-2">
                            {q.options.slice(0, 4).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                              >
                                <strong className="text-slate-800">{['A', 'B', 'C', 'D'][oIdx]}.</strong>{' '}
                                <MathText text={opt} />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'YESNO' && q.options && q.options.length > 0 && (
                          <div className="space-y-2 mt-2 pl-2">
                            {q.options.slice(0, 4).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between"
                              >
                                <span>
                                  <strong className="text-slate-800">{['a', 'b', 'c', 'd'][oIdx]})</strong>{' '}
                                  <MathText text={opt} />
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600">Đúng / Sai</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Preview and walkthrough info pane */}
                        <div className="bg-emerald-50/30 border border-emerald-100/50 p-3 rounded-xl mt-2.5 space-y-1 text-xs">
                          <p className="font-extrabold text-emerald-800 flex items-center gap-1">
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                            Lời giải chính xác và hướng dẫn:
                          </p>
                          <p className="text-slate-700">
                            <strong>Thành phần đáp án:</strong>{' '}
                            {q.type === 'YESNO'
                              ? q.answer
                                  .split(',')
                                  .map(
                                    (aStr, aIdx) =>
                                      `${['a', 'b', 'c', 'd'][aIdx]} (${
                                        aStr === 'true' ? 'Đúng' : 'Sai'
                                      })`
                                  )
                                  .join(', ')
                              : q.type === 'MCQ'
                              ? ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer
                              : q.answer}
                          </p>
                          <p className="text-slate-500 font-semibold italic leading-relaxed mt-1">
                            <MathText text={q.explain} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <Eye className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold font-sans">ĐỀ THI ĐANG TRỐNG CỰC BỘ</p>
                    <p className="text-[11px] text-zinc-405 italic">
                      Hãy quét đề mẫu bằng TXT / dán văn bản phía trái để bóc tách thông minh, hoặc tự rèn luyện soạn câu hỏi đơn lẻ bằng bảng biểu phía trái.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODE 3: EXAM COMPILATION FROM QUESTION BANK
          ========================================== */}
      {creationMode === 'fromBank' && (
        <div className="space-y-6">
          {/* Top Banner with compiled test metadata */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Tiêu đề đề thi biên khảo
              </label>
              <input
                type="text"
                value={bankTitle}
                onChange={(e) => setBankTitle(e.target.value)}
                className="w-full text-sm font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề đề kiểm tra tinh lọc..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Môn học & Khối học
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={bankSub}
                  onChange={(e) => setBankSub(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Toán">Toán Học</option>
                  <option value="Tin học">Tin Học</option>
                </select>
                <select
                  value={bankGrade}
                  onChange={(e) => setBankGrade(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Thời lượng & Hình thức
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2 border border-slate-200 rounded-xl">
                  <input
                    type="number"
                    min={5}
                    value={bankDuration}
                    onChange={(e) => setBankDuration(parseInt(e.target.value) || 45)}
                    className="w-full text-xs font-black text-center outline-none border-none py-2"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">phút</span>
                </div>
                <select
                  value={bankType}
                  onChange={(e) => setBankType(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ôn tập">Ôn tập</option>
                  <option value="giữa kỳ">Giữa kỳ</option>
                  <option value="cuối kỳ">Cuối kỳ</option>
                  <option value="kiểm tra thường xuyên">15 phút</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (Span 2): Browse & Filters & Target Counts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Targets and counts dashboard check */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
                  <Clipboard className="w-4 h-4 text-indigo-600" />
                  Mục tiêu cơ cấu & Thang điểm
                </h3>
                {renderTypeConfigControls()}
                
                <button
                  type="button"
                  onClick={handleAutoSelectQuestionsFromBank}
                  className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase transition-all duration-205"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  Tự động chọn đề từ Kho (theo cơ cấu)
                </button>
              </div>

              {/* Live search and filters from database */}
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Tìm & Lọc câu hỏi trong Kho
                </h3>

                <div className="space-y-3">
                  {/* Text search */}
                  <div>
                    <input
                      type="text"
                      placeholder="Tìm từ khóa nội dung câu hỏi..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>

                  {/* Multiple Select Dropdowns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Mức độ nhận thức</label>
                        <div className="flex gap-1.5 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setBankSelectedLevels(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'])}
                            className="text-blue-600 hover:underline cursor-pointer bg-none border-none p-0"
                          >
                            Tất cả
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setBankSelectedLevels([])}
                            className="text-rose-600 hover:underline cursor-pointer bg-none border-none p-0"
                          >
                            Xóa hết
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                        {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as QuestionLevel[]).map((lvl) => {
                          const isSelected = bankSelectedLevels.includes(lvl);
                          return (
                            <label
                              key={lvl}
                              className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-[10px] font-bold cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                                  : 'bg-white border border-slate-150 hover:bg-slate-50 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setBankSelectedLevels(bankSelectedLevels.filter((x) => x !== lvl));
                                  } else {
                                    setBankSelectedLevels([...bankSelectedLevels, lvl]);
                                  }
                                }}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span>{lvl}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Dạng câu hỏi</label>
                        <div className="flex gap-1.5 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setBankSelectedTypes(['MCQ', 'YESNO', 'SHORT', 'ESSAY'])}
                            className="text-blue-600 hover:underline cursor-pointer bg-none border-none p-0 animate-none"
                          >
                            Tất cả
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setBankSelectedTypes([])}
                            className="text-rose-600 hover:underline cursor-pointer bg-none border-none p-0 animate-none"
                          >
                            Xóa hết
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                        {([
                          { type: 'MCQ', label: 'Trắc nghiệm MCQ' },
                          { type: 'YESNO', label: 'Đúng / Sai' },
                          { type: 'SHORT', label: 'Trả lời ngắn' },
                          { type: 'ESSAY', label: 'Tự luận' }
                        ] as { type: QuestionType, label: string }[]).map((itm) => {
                          const lvlType = itm.type;
                          const isSelected = bankSelectedTypes.includes(lvlType);
                          return (
                            <label
                              key={lvlType}
                              className={`flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-[10px] font-bold cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                                  : 'bg-white border border-slate-150 hover:bg-slate-50 text-slate-500'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setBankSelectedTypes(bankSelectedTypes.filter((x) => x !== lvlType));
                                  } else {
                                    setBankSelectedTypes([...bankSelectedTypes, lvlType]);
                                  }
                                }}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span>{itm.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* LỰA CHỌN CHƯƠNG, BÀI CHO BIÊN SOẠN */}
                  <div className="space-y-2 border-t pt-3 border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" />
                        Chọn Chương và Bài học
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const activeSyl = syllabus.find((sy) => sy.subject === bankSub && sy.grade === bankGrade);
                            if (activeSyl) {
                              setBankSelectedChapterIds(activeSyl.chapters.map(c => c.id));
                              const lesIds: string[] = [];
                              activeSyl.chapters.forEach(c => c.lessons.forEach(l => lesIds.push(l.id)));
                              setBankSelectedLessonIds(lesIds);
                            }
                          }}
                          className="text-[9px] font-black text-indigo-600 hover:underline bg-none border-none cursor-pointer"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-[9px] text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBankSelectedChapterIds([]);
                            setBankSelectedLessonIds([]);
                          }}
                          className="text-[9px] font-black text-rose-500 hover:underline bg-none border-none cursor-pointer"
                        >
                          Bỏ chọn hết
                        </button>
                      </div>
                    </div>

                    {bankCurrentChapters.length > 0 ? (
                      <div className="max-h-[180px] overflow-y-auto border border-slate-150 rounded-lg p-2.5 space-y-3 bg-slate-50 custom-scrollbar">
                        {bankCurrentChapters.map((ch) => {
                          const isChapterSelected = bankSelectedChapterIds.includes(ch.id);
                          const chapterLessons = ch.lessons || [];

                          return (
                            <div key={ch.id} className="space-y-1 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              {/* Chapter row selector */}
                              <div className="flex items-start gap-2">
                                <input
                                  id={`bank-ch-select-${ch.id}`}
                                  type="checkbox"
                                  checked={isChapterSelected}
                                  onChange={() => {
                                    if (isChapterSelected) {
                                      setBankSelectedChapterIds(bankSelectedChapterIds.filter(id => id !== ch.id));
                                      const lesIdsToKeep = bankSelectedLessonIds.filter(id => !chapterLessons.some(l => l.id === id));
                                      setBankSelectedLessonIds(lesIdsToKeep);
                                    } else {
                                      setBankSelectedChapterIds([...bankSelectedChapterIds, ch.id]);
                                      const lesIdsToAdd = chapterLessons.map(l => l.id).filter(id => !bankSelectedLessonIds.includes(id));
                                      setBankSelectedLessonIds([...bankSelectedLessonIds, ...lesIdsToAdd]);
                                    }
                                  }}
                                  className="rounded text-indigo-500 focus:ring-indigo-500 mt-0.5"
                                />
                                <label htmlFor={`bank-ch-select-${ch.id}`} className="text-xs font-bold text-slate-800 leading-tight cursor-pointer">
                                  {ch.title}
                                </label>
                              </div>

                              {/* Lessons checkbox list */}
                              {chapterLessons.length > 0 && (
                                <div className="pl-5 space-y-1 border-l-2 border-slate-200 ml-1.5 mt-1">
                                  {chapterLessons.map((les) => {
                                    const isLessonSelected = bankSelectedLessonIds.includes(les.id);
                                    return (
                                      <div key={les.id} className="flex items-start gap-2">
                                        <input
                                          id={`bank-les-select-${les.id}`}
                                          type="checkbox"
                                          checked={isLessonSelected}
                                          onChange={() => {
                                            if (isLessonSelected) {
                                              setBankSelectedLessonIds(bankSelectedLessonIds.filter(id => id !== les.id));
                                            } else {
                                              setBankSelectedLessonIds([...bankSelectedLessonIds, les.id]);
                                              if (!isChapterSelected) {
                                                setBankSelectedChapterIds([...bankSelectedChapterIds, ch.id]);
                                              }
                                            }
                                          }}
                                          className="rounded text-indigo-500 focus:ring-indigo-500 mt-0.5"
                                        />
                                        <label htmlFor={`bank-les-select-${les.id}`} className="text-[11px] text-slate-600 font-medium leading-tight cursor-pointer">
                                          {les.title}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Môn học và Khối lớp này chưa đăng ký chi tiết học liệu dạng chương bài.</p>
                    )}
                  </div>
                </div>

                {/* Searched Results feed list */}
                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {(() => {
                    const filtered = questions.filter((q) => {
                      // match subject & grade
                      if (q.subject !== bankSub || q.grade !== bankGrade) return false;

                      // match selected chapters
                      if (bankSelectedChapterIds.length > 0 && !bankSelectedChapterIds.includes(q.chapterId)) {
                        return false;
                      }
                      // match selected lessons
                      if (bankSelectedLessonIds.length > 0 && q.lessonId && !bankSelectedLessonIds.includes(q.lessonId)) {
                        return false;
                      }

                      // text match
                      if (bankSearch && !q.content.toLowerCase().includes(bankSearch.toLowerCase())) return false;
                      // level filter
                      if (bankSelectedLevels.length > 0 && !bankSelectedLevels.includes(q.level)) return false;
                      if (bankSelectedLevels.length === 0) return false; // no levels checked means nothing matches
                      // type filter
                      if (bankSelectedTypes.length > 0 && !bankSelectedTypes.includes(q.type)) return false;
                      if (bankSelectedTypes.length === 0) return false; // no types checked means nothing matches
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 font-bold">
                          Không tìm thấy câu hỏi tương thích trong Kho!
                        </div>
                      );
                    }

                    return filtered.map((q) => {
                      const isSelected = selectedBankQuestions.some((item) => item.id === q.id);
                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-xl border text-xs transition-all space-y-2.5 ${
                            isSelected
                              ? 'border-emerald-300 bg-emerald-50/20'
                              : 'border-slate-150 hover:border-blue-300 bg-white shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold text-[9px] rounded uppercase">
                                {q.level || 'Thông hiểu'}
                              </span>
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold text-[9px] rounded uppercase">
                                {q.type}
                              </span>
                            </div>
                            <button
                              type="button; button"
                              onClick={() => toggleSelectBankQuestion(q)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all ${
                                isSelected
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-650 hover:bg-blue-700 text-white shadow-xs'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Đã chọn
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-white" />
                                  Chọn câu hỏi
                                </>
                              )}
                            </button>
                          </div>

                          <div className="font-semibold text-slate-700 leading-relaxed">
                            <MathText text={q.content} />
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {q.options.slice(0, 4).map((opt, oIdx) => (
                                <div key={oIdx} className="p-1 px-2 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-500">
                                  <strong>{['A', 'B', 'C', 'D'][oIdx]}.</strong> <MathText text={opt} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column (Span 3): Previews & Compile controls */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Xem trước cấu trúc đề đang biên soạn từ Kho
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Dễ dàng điều chỉnh thứ tự, loại bỏ hoặc kiểm tra tổng điểm.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black rounded-xl">
                    Đã chọn: {selectedBankQuestions.length} câu
                  </span>
                </div>

                {/* Exporters and Action buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBankExam}
                      disabled={selectedBankQuestions.length === 0}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-40 cursor-pointer uppercase transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 animate-pulse" />
                      TẠO ĐỀ THI & ĐỒNG BỘ KHO
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportBankTxt}
                      disabled={selectedBankQuestions.length === 0}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Xuất tệp TXT
                    </button>
                    <button
                      type="button"
                      onClick={handleExportBankDocx}
                      disabled={selectedBankQuestions.length === 0}
                      className="px-3 py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-100" />
                      XUẤT ĐỀ WORD (.doc)
                    </button>
                  </div>
                </div>

                {/* Selected Question lists view */}
                <div className="border border-slate-200 rounded-2xl bg-white p-5 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {selectedBankQuestions.length > 0 ? (
                    <div className="divide-y divide-slate-150 space-y-4">
                      {selectedBankQuestions.map((q, idx) => (
                        <div key={`${q.id}-${idx}`} className="space-y-2.5 pt-4 first:pt-0 pb-1.5 border-b border-slate-50 last:border-none">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black text-slate-600 uppercase">
                                {q.level || 'Thông hiểu'}
                              </span>
                              <span className="text-xs font-black text-slate-800">Câu {idx + 1}</span>
                              <span className="text-[10px] text-zinc-400 font-bold">({q.type})</span>
                              <span className="text-xs text-emerald-600 font-bold ml-2">({getQuestionPointStyle(q.type)}đ)</span>
                            </div>

                            <div className="flex items-center gap-1 shadow-sm rounded-lg bg-slate-50 border p-1">
                              <button
                                type="button"
                                onClick={() => moveBankQuestionUp(idx)}
                                disabled={idx === 0}
                                className="p-1 hover:bg-white text-slate-500 rounded disabled:opacity-20 cursor-pointer animate-none"
                                title="Chuyển lên"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBankQuestionDown(idx)}
                                disabled={idx === selectedBankQuestions.length - 1}
                                className="p-1 hover:bg-white text-slate-500 rounded disabled:opacity-20 cursor-pointer animate-none"
                                title="Chuyển xuống"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSwapBankQuestion(idx)}
                                className="p-1 text-blue-600 hover:bg-white rounded cursor-pointer transition-colors"
                                title="Đổi sang câu hỏi khác"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBankQuestion(idx)}
                                className="p-1 text-rose-500 hover:bg-white rounded cursor-pointer"
                                title="Bỏ chọn câu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-slate-800 leading-relaxed pl-1.5 border-l-2 border-blue-400">
                            <MathText text={q.content} />
                          </div>

                          {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                              {q.options.slice(0, 4).map((opt, oIdx) => (
                                <div key={oIdx} className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                  <strong>{['A', 'B', 'C', 'D'][oIdx]}.</strong> <MathText text={opt} />
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === 'YESNO' && q.options && q.options.length > 0 && (
                            <div className="space-y-1 mt-2 pl-2">
                              {q.options.slice(0, 4).map((opt, oIdx) => (
                                <div key={oIdx} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 px-3 rounded border border-slate-100 flex items-center justify-between">
                                  <span>
                                    <strong>{['a', 'b', 'c', 'd'][oIdx]})</strong> <MathText text={opt} />
                                  </span>
                                  <span className="text-[9px] font-bold text-blue-600">Đúng/Sai</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="bg-emerald-50/30 border border-emerald-100 p-2.5 rounded-lg text-[11px] mt-2 space-y-0.5 animate-fadeIn">
                            <p className="font-bold text-emerald-800">Lời giải & Đáp án:</p>
                            <p className="text-slate-700">
                              <strong>Đáp án đúng:</strong>{' '}
                              {q.type === 'YESNO'
                                ? q.answer.split(',').map((item, idX) => `${['a', 'b', 'c', 'd'][idX]} (${item === 'true' ? 'Đúng' : 'Sai'})`).join(', ')
                                : q.type === 'MCQ'
                                ? ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer
                                : q.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 space-y-4">
                      <BookOpen className="w-10 h-10 text-slate-200 mx-auto animate-bounce" />
                      <div>
                        <p className="text-xs font-black uppercase text-slate-700">Chưa có câu hỏi được chọn</p>
                        <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                          Bạn có thể nhấn <strong>"Chọn câu hỏi"</strong> ở từng câu dưới danh mục lọc bên trái, hoặc nhấn nhanh nút dưới đây để hệ thống tự động lọc và chọn ngẫu nhiên các câu hỏi đúng cơ cấu:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoSelectQuestionsFromBank}
                        className="mx-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer uppercase transition-all duration-205"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Tự động chọn đề đúng cơ cấu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
