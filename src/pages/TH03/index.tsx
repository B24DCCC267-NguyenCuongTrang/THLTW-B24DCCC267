import React, { useState, useEffect } from 'react';
import styles from './TH03.module.css';

interface Employee {
  id: number;
  name: string;
  max_customers_per_day: number;
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Appointment {
  id: number;
  customer_name: string;
  employee_id: number;
  service_id: number;
  employee_name: string;
  service_name: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  price: number;
}

const API_BASE = 'http://localhost:9001';

const TH03: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [msg, setMsg] = useState('');

  // Form states
  const [empName, setEmpName] = useState('');
  const [empMax, setEmpMax] = useState(8);
  const [svName, setSvName] = useState('');
  const [svPrice, setSvPrice] = useState('');
  const [svDur, setSvDur] = useState('');
  const [cusName, setCusName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [e, s, a] = await Promise.all([
        fetch('${API_BASE}/employees').then(r => r.json()),
        fetch('${API_BASE}/services').then(r => r.json()),
        fetch('${API_BASE}/appointments').then(r => r.json())
      ]);
      setEmployees(e || []);
      setServices(s || []);
      setAppointments(a || []);
    } catch (err) {
      console.error('Load error:', err);
    }
  }

  async function addEmployee() {
    if (!empName) {
      setMsg('Vui lòng nhập tên nhân viên');
      return;
    }
    try {
      const r = await fetch('${API_BASE}/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: empName, max_customers_per_day: empMax })
      });
      if (r.ok) {
        setEmpName('');
        setEmpMax(8);
        setMsg('✓ Đã thêm nhân viên');
        load();
      } else {
        const err = await r.json();
        setMsg(`❌ ${err.message}`);
      }
    } catch (err) {
      setMsg('❌ Lỗi');
    }
  }

  async function addService() {
    if (!svName || !svPrice || !svDur) {
      setMsg('Vui lòng điền đầy đủ thông tin dịch vụ');
      return;
    }
    try {
      const r = await fetch('${API_BASE}/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: svName, price: Number(svPrice), duration_minutes: Number(svDur) })
      });
      if (r.ok) {
        setSvName('');
        setSvPrice('');
        setSvDur('');
        setMsg('✓ Đã thêm dịch vụ');
        load();
      } else {
        const err = await r.json();
        setMsg(`❌ ${err.message}`);
      }
    } catch (err) {
      setMsg('❌ Lỗi');
    }
  }

  async function book() {
    if (!cusName || !employeeId || !serviceId || !startTime) {
      setMsg('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      const r = await fetch('${API_BASE}/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: cusName,
          employee_id: Number(employeeId),
          service_id: Number(serviceId),
          start_time: startTime,
          note
        })
      });
      if (r.ok) {
        setCusName('');
        setEmployeeId('');
        setServiceId('');
        setStartTime('');
        setNote('');
        setMsg('✓ Đặt lịch thành công');
        load();
      } else {
        const err = await r.json();
        setMsg(`❌ ${err.message}`);
      }
    } catch (err) {
      setMsg('❌ Lỗi');
    }
  }

  return (
    <div className={styles.container}>
      <h1> Hệ thống Đặt Lịch Hẹn</h1>
      {msg && <div className={styles.msg}>{msg}</div>}

      {/* EMPLOYEES */}
      <section className={styles.section}>
        <h2> Quản lý Nhân viên ({employees.length})</h2>
        <div className={styles.form}>
          <input 
            placeholder="Tên nhân viên" 
            value={empName}
            onChange={e => setEmpName(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Max khách/ngày" 
            value={empMax}
            onChange={e => setEmpMax(Number(e.target.value))}
          />
          <button onClick={addEmployee}>Thêm</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Tên</th><th>Max/ngày</th></tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.name}</td>
                <td>{e.max_customers_per_day}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SERVICES */}
      <section className={styles.section}>
        <h2> Quản lý Dịch vụ ({services.length})</h2>
        <div className={styles.form}>
          <input 
            placeholder="Tên dịch vụ" 
            value={svName}
            onChange={e => setSvName(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Giá" 
            value={svPrice}
            onChange={e => setSvPrice(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Thời lượng (phút)" 
            value={svDur}
            onChange={e => setSvDur(e.target.value)}
          />
          <button onClick={addService}>Thêm</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Tên</th><th>Giá</th><th>Phút</th></tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.price.toLocaleString('vi')}</td>
                <td>{s.duration_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* APPOINTMENTS */}
      <section className={styles.section}>
        <h2> Đặt lịch hẹn ({appointments.length})</h2>
        <div className={styles.form}>
          <input 
            placeholder="Tên khách hàng" 
            value={cusName}
            onChange={e => setCusName(e.target.value)}
          />
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
            <option value="">-- Chọn nhân viên --</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select value={serviceId} onChange={e => setServiceId(e.target.value)}>
            <option value="">-- Chọn dịch vụ --</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.price}đ)</option>
            ))}
          </select>
          <input 
            type="datetime-local" 
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
          <input 
            placeholder="Ghi chú" 
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button onClick={book}>Đặt lịch</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Khách</th><th>Nhân viên</th><th>Dịch vụ</th><th>Giờ</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.customer_name}</td>
                <td>{a.employee_name}</td>
                <td>{a.service_name}</td>
                <td>{new Date(a.start_time).toLocaleString('vi')}</td>
                <td><span className={styles[a.status.toLowerCase()]}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default TH03;

