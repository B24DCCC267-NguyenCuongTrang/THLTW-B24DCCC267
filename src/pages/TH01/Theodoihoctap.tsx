import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Table, Form, InputNumber, message } from 'antd';

const Theodoihoctap = () => {
  const [subjects, setSubjects] = useState<string[]>(['Toán', 'Văn', 'Anh']);
  const [newSubject, setNewSubject] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [goal, setGoal] = useState(0);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<any>(null);

  
  useEffect(() => {
    const s = localStorage.getItem('subjects');
    const sess = localStorage.getItem('sessions');
    const g = localStorage.getItem('goal');
    if (s) setSubjects(JSON.parse(s));
    if (sess) setSessions(JSON.parse(sess));
    if (g) setGoal(Number(g));
  }, []);

  
  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('sessions', JSON.stringify(sessions));
    localStorage.setItem('goal', String(goal));
  }, [subjects, sessions, goal]);

  
  const addSubject = () => {
    if (newSubject.trim()) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  
  const deleteSubject = (s: string) => {
    setSubjects(subjects.filter(x => x !== s));
  };

  
  const onFinish = (values: any) => {
    if (editing) {
      setSessions(sessions.map(s => s.id === editing.id ? { ...values, id: editing.id } : s));
      message.success('Đã sửa!');
    } else {
      setSessions([...sessions, { ...values, id: Date.now() }]);
      message.success('Đã thêm!');
    }
    form.resetFields();
    setEditing(null);
  };

  
  const edit = (record: any) => {
    setEditing(record);
    form.setFieldsValue(record);
  };

  
  const del = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

 
  const total = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const columns = [
    { title: 'Môn', dataIndex: 'subject', key: 'subject', width: 100 },
    { title: 'Ngày giờ', dataIndex: 'time', key: 'time', width: 150 },
    { title: 'Giờ', dataIndex: 'duration', key: 'duration', width: 60 },
    { title: 'Nội dung', dataIndex: 'content', key: 'content', width: 200 },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', width: 150 },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: any, r: any) => (
        <>
          <Button size="small" onClick={() => edit(r)}>Sửa</Button>
          <Button size="small" danger onClick={() => del(r.id)} style={{ marginLeft: 5 }}>Xóa</Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card title="Môn học" size="small" style={{ marginBottom: 10 }}>
        <Input
          placeholder="Tên môn"
          value={newSubject}
          onChange={e => setNewSubject(e.target.value)}
          style={{ width: 150, marginRight: 5 }}
        />
        <Button onClick={addSubject}>Thêm</Button>
        <div style={{ marginTop: 10 }}>
          {subjects.map(s => (
            <span key={s} style={{ marginRight: 10 }}>
              {s} <Button size="small" danger onClick={() => deleteSubject(s)}>X</Button>
            </span>
          ))}
        </div>
      </Card>

      <Card title="Mục tiêu" size="small" style={{ marginBottom: 10 }}>
        <InputNumber min={0} value={goal} onChange={v => setGoal(v || 0)} /> giờ/tháng
        <span style={{ marginLeft: 20 }}>
          Đã học: <strong>{total}/{goal}</strong> giờ 
          {goal > 0 && <span style={{ color: total >= goal ? 'green' : 'red' }}>
            {total >= goal ? ' ✓ Đạt' : ' ✗ Chưa đạt'}
          </span>}
        </span>
      </Card>

      <Card title="Lịch học" size="small" style={{ marginBottom: 10 }}>
        <Form form={form} onFinish={onFinish} layout="inline">
          <Form.Item name="subject" rules={[{ required: true }]}>
            <Select placeholder="Môn" style={{ width: 100 }}>
              {subjects.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="time" rules={[{ required: true }]}>
            <Input type="datetime-local" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="duration" rules={[{ required: true }]}>
            <InputNumber placeholder="Giờ" min={0} style={{ width: 80 }} />
          </Form.Item>
          <Form.Item name="content">
            <Input placeholder="Nội dung" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="note">
            <Input placeholder="Ghi chú" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">{editing ? 'Sửa' : 'Thêm'}</Button>
            {editing && <Button onClick={() => { form.resetFields(); setEditing(null); }}>Hủy</Button>}
          </Form.Item>
        </Form>
      </Card>

      <Table columns={columns} dataSource={sessions} rowKey="id" size="small" />
    </div>
  );
};

export default Theodoihoctap;
