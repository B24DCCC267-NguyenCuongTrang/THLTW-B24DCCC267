import React, { useMemo, useState } from 'react';

type Difficulty = 'Dễ' | 'Trung bình' | 'Khó' | 'Rất khó';
type Topic = { id: string; name: string };
type Subject = { id: string; code: string; name: string; credits: number };
type Question = { id: string; subjectId: string; topicId: string; content: string; difficulty: Difficulty };
type Line = { topicId: string; difficulty: Difficulty; count: number };
type Structure = { id: string; name: string; subjectId: string; lines: Line[] };
type Exam = { id: string; name: string; subjectId: string; structureId?: string; questionIds: string[]; createdAt: string };

const DIFFS: Difficulty[] = ['Dễ', 'Trung bình', 'Khó', 'Rất khó'];
const id = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const pick = <T,>(arr: T[], n: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const Quanlinganhang: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [msg, setMsg] = useState('');

  // Form danh mục
  const [topicName, setTopicName] = useState('');
  const [sForm, setSForm] = useState({ code: '', name: '', credits: 3 });

  // Form câu hỏi + filter
  const [qForm, setQForm] = useState({ subjectId: '', topicId: '', content: '', difficulty: 'Dễ' as Difficulty });
  const [filter, setFilter] = useState({ subjectId: '', topicId: '', difficulty: '' as Difficulty | '' });

  // Form cấu trúc + tạo đề
  const [draft, setDraft] = useState<{ name: string; subjectId: string; lines: Line[] }>({
    name: '',
    subjectId: '',
    lines: [{ topicId: '', difficulty: 'Dễ', count: 1 }],
  });
  const [examName, setExamName] = useState('');
  const [editExam, setEditExam] = useState<{ id: string; name: string }>({ id: '', name: '' });

  const filteredQuestions = useMemo(
    () =>
      questions.filter((q) => {
        if (filter.subjectId && q.subjectId !== filter.subjectId) return false;
        if (filter.topicId && q.topicId !== filter.topicId) return false;
        if (filter.difficulty && q.difficulty !== filter.difficulty) return false;
        return true;
      }),
    [questions, filter],
  );

  const addTopic = () => {
    if (!topicName.trim()) return;
    setTopics((p) => [...p, { id: id(), name: topicName.trim() }]);
    setTopicName('');
  };

  const addSubject = () => {
    if (!sForm.code.trim() || !sForm.name.trim()) return;
    setSubjects((p) => [...p, { id: id(), code: sForm.code.trim(), name: sForm.name.trim(), credits: Number(sForm.credits) || 0 }]);
    setSForm({ code: '', name: '', credits: 3 });
  };

  const addQuestion = () => {
    if (!qForm.subjectId || !qForm.topicId || !qForm.content.trim()) return;
    setQuestions((p) => [...p, { id: id(), ...qForm, content: qForm.content.trim() }]);
    setQForm((f) => ({ ...f, content: '' }));
  };

  const updateLine = (i: number, patch: Partial<Line>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));

  const addLine = () => setDraft((d) => ({ ...d, lines: [...d.lines, { topicId: '', difficulty: 'Dễ', count: 1 }] }));
  const removeLine = (i: number) => setDraft((d) => ({ ...d, lines: d.lines.filter((_, idx) => idx !== i) }));

  const saveStructure = () => {
    if (!draft.name.trim() || !draft.subjectId || draft.lines.length === 0) return;
    if (draft.lines.some((l) => !l.topicId || l.count <= 0)) return;
    setStructures((p) => [...p, { id: id(), name: draft.name.trim(), subjectId: draft.subjectId, lines: draft.lines.map((l) => ({ ...l })) }]);
    setMsg('Đã lưu cấu trúc đề.');
  };

  const generateExam = (s?: Structure) => {
    setMsg('');
    const target = s ?? { id: '', name: draft.name, subjectId: draft.subjectId, lines: draft.lines };
    if (!target.subjectId || target.lines.length === 0) return setMsg('Thiếu cấu trúc đề.');

    const used = new Set<string>();
    const selected: Question[] = [];

    for (const line of target.lines) {
      const pool = questions.filter(
        (q) =>
          q.subjectId === target.subjectId &&
          q.topicId === line.topicId &&
          q.difficulty === line.difficulty &&
          !used.has(q.id),
      );
      if (pool.length < line.count) {
        const tName = topics.find((t) => t.id === line.topicId)?.name || 'N/A';
        return setMsg(`Không đủ câu hỏi: ${tName} - ${line.difficulty} (cần ${line.count}, có ${pool.length})`);
      }
      const chosen = pick(pool, line.count);
      chosen.forEach((q) => used.add(q.id));
      selected.push(...chosen);
    }

    setExams((p) => [
      {
        id: id(),
        name: examName.trim() || `Đề ${new Date().toLocaleString()}`,
        subjectId: target.subjectId,
        structureId: target.id || undefined,
        questionIds: selected.map((q) => q.id),
        createdAt: new Date().toLocaleString(),
      },
      ...p,
    ]);
    setExamName('');
    setMsg(`Tạo đề thành công: ${selected.length} câu.`);
  };

  const saveExamEdit = () => {
    if (!editExam.id || !editExam.name.trim()) return;
    setExams((p) => p.map((e) => (e.id === editExam.id ? { ...e, name: editExam.name.trim() } : e)));
    setEditExam({ id: '', name: '' });
  };

  const subjectName = (idv: string) => subjects.find((s) => s.id === idv)?.name || '';
  const subjectCode = (idv: string) => subjects.find((s) => s.id === idv)?.code || '';
  const topicNameById = (idv: string) => topics.find((t) => t.id === idv)?.name || '';

  return (
    <div style={{ padding: 16 }}>
      <h1>Bài 2 - Quản lý ngân hàng câu hỏi</h1>

      <h3>1) Danh mục khối kiến thức</h3>
      <input value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="Tên khối kiến thức" />
      <button onClick={addTopic}>Thêm</button>
      <ul>{topics.map((t) => <li key={t.id}>{t.name}</li>)}</ul>

      <h3>2) Danh mục môn học</h3>
      <input value={sForm.code} onChange={(e) => setSForm({ ...sForm, code: e.target.value })} placeholder="Mã môn" />
      <input value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="Tên môn" />
      <input type="number" value={sForm.credits} onChange={(e) => setSForm({ ...sForm, credits: Number(e.target.value) })} />
      <button onClick={addSubject}>Thêm</button>
      <ul>{subjects.map((s) => <li key={s.id}>{s.code} - {s.name} ({s.credits} TC)</li>)}</ul>

      <h3>3) Quản lý câu hỏi + tìm kiếm</h3>
      <select value={qForm.subjectId} onChange={(e) => setQForm({ ...qForm, subjectId: e.target.value })}>
        <option value="">-- Môn học --</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
      </select>
      <select value={qForm.topicId} onChange={(e) => setQForm({ ...qForm, topicId: e.target.value })}>
        <option value="">-- Khối kiến thức --</option>
        {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value as Difficulty })}>
        {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <br />
      <textarea value={qForm.content} onChange={(e) => setQForm({ ...qForm, content: e.target.value })} rows={3} style={{ width: '100%' }} />
      <button onClick={addQuestion}>Thêm câu hỏi</button>

      <div style={{ marginTop: 8 }}>
        <select value={filter.subjectId} onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}>
          <option value="">Tất cả môn</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
        </select>
        <select value={filter.topicId} onChange={(e) => setFilter({ ...filter, topicId: e.target.value })}>
          <option value="">Tất cả khối</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filter.difficulty} onChange={(e) => setFilter({ ...filter, difficulty: e.target.value as Difficulty | '' })}>
          <option value="">Tất cả mức độ</option>
          {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <ul>
        {filteredQuestions.map((q) => (
          <li key={q.id}>[{q.id}] {subjectCode(q.subjectId)} | {topicNameById(q.topicId)} | {q.difficulty} - {q.content}</li>
        ))}
      </ul>

      <h3>4) Quản lý đề thi</h3>
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Tên cấu trúc đề" />
      <select value={draft.subjectId} onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}>
        <option value="">-- Môn học --</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
      </select>

      {draft.lines.map((l, i) => (
        <div key={i}>
          <select value={l.topicId} onChange={(e) => updateLine(i, { topicId: e.target.value })}>
            <option value="">-- Khối --</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={l.difficulty} onChange={(e) => updateLine(i, { difficulty: e.target.value as Difficulty })}>
            {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="number" min={1} value={l.count} onChange={(e) => updateLine(i, { count: Number(e.target.value) })} />
          <button onClick={() => removeLine(i)}>Xóa</button>
        </div>
      ))}
      <button onClick={addLine}>+ Dòng</button>
      <button onClick={saveStructure}>Lưu cấu trúc</button>

      <div style={{ marginTop: 8 }}>
        <input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Tên đề" />
        <button onClick={() => generateExam()}>Tạo đề theo cấu trúc đang nhập</button>
      </div>
      {msg && <p><b>{msg}</b></p>}

      <h4>Cấu trúc đã lưu</h4>
      <ul>
        {structures.map((s) => (
          <li key={s.id}>
            {s.name} ({subjectCode(s.subjectId)})
            <button onClick={() => generateExam(s)}>Tạo đề từ cấu trúc này</button>
          </li>
        ))}
      </ul>

      <h4>Đề thi đã lưu</h4>
      <ul>
        {exams.map((e) => (
          <li key={e.id}>
            <b>{e.name}</b> - {subjectName(e.subjectId)} - {e.createdAt} - {e.questionIds.length} câu
            <details>
              <summary>Xem câu hỏi</summary>
              <ol>
                {e.questionIds.map((qid) => <li key={qid}>{questions.find((q) => q.id === qid)?.content}</li>)}
              </ol>
            </details>
            <button onClick={() => setEditExam({ id: e.id, name: e.name })}>Sửa tên đề</button>
          </li>
        ))}
      </ul>

      {editExam.id && (
        <div>
          <input value={editExam.name} onChange={(e) => setEditExam({ ...editExam, name: e.target.value })} />
          <button onClick={saveExamEdit}>Lưu sửa</button>
        </div>
      )}
    </div>
  );
};

export default Quanlinganhang;