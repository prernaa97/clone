import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';

export default function AdminPlans(){
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    _id: '',
    name: '',
    days: '',
    postLimit: '',
    discount: 0,
    price: ''
  });

  const token = useMemo(()=>Cookies.get('token'),[]);

  const loadPlans = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/plan');
      if(res.data?.success){ setPlans(res.data.plans || []); }
    } catch (e) { console.error(e); }
  };

  useEffect(()=>{ loadPlans(); },[]);

  const clearForm = () => setForm({_id:'', name:'', days:'', postLimit:'', discount:0, price:''});

  const onSave = async () => {
    if(!form.name?.trim()){ toast.error('Plan name is required'); return; }
    if(!form.days || Number(form.days) < 1){ toast.error('Days must be >= 1'); return; }
    if(!form.postLimit || Number(form.postLimit) < 1){ toast.error('Post limit must be >= 1'); return; }
    if(form.discount < 0 || form.discount > 100){ toast.error('Discount must be 0-100'); return; }
    if(form.price === '' || Number(form.price) < 0){ toast.error('Price must be >= 0'); return; }

    try {
      setSaving(true);
      const url = form._id ? `http://localhost:5000/api/plan/manage?id=${form._id}` : 'http://localhost:5000/api/plan/manage';
      const res = await axios.post(url, {
        name: form.name.trim(),
        days: Number(form.days),
        postLimit: Number(form.postLimit),
        discount: Number(form.discount),
        price: Number(form.price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.data?.success){
        toast.success(form._id ? 'Plan updated' : 'Plan created');
        clearForm();
        await loadPlans();
      } else {
        toast.error(res.data?.message || 'Save failed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Save failed');
    } finally { setSaving(false); }
  };

  const onDelete = async () => {
    if(!form._id){ toast.info('Select a plan first'); return; }
    if(!confirm('Delete this plan?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/plan/${form._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan deleted');
      clearForm();
      await loadPlans();
    } catch (e) {
      console.error(e);
      toast.error('Delete failed');
    }
  };

  const selectPlan = (p) => setForm({
    _id: p._id,
    name: p.name,
    days: String(p.days),
    postLimit: String(p.postLimit),
    discount: Number(p.discount || 0),
    price: String(p.price)
  });

  return (
    <div className="container-fluid p-4">
      <ToastContainer />
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <i className="fas fa-list-alt me-2"></i>Available Plans
            </div>
            <div className="card-body" style={{maxHeight: '60vh', overflowY:'auto'}}>
              {plans.map(p => (
                <div key={p._id} className="border rounded p-2 mb-2" role="button" onClick={()=>selectPlan(p)}>
                  <div className="d-flex justify-content-between">
                    <div className="fw-semibold">{p.name}</div>
                    <div className="text-primary">₹{p.price}</div>
                  </div>
                  <div className="text-muted small">{p.days} days • {p.postLimit} posts</div>
                  {!!p.discount && <div className="text-success small">{p.discount}% off</div>}
                </div>
              ))}
              {plans.length === 0 && <div className="text-muted">No plans yet</div>}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>Plan Information</div>
                <button className="btn btn-light btn-sm" onClick={clearForm}><i className="fas fa-plus me-1"></i>New Plan</button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Plan Name</label>
                  <input className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Duration (Days)</label>
                  <input type="number" min="1" className="form-control" value={form.days} onChange={e=>setForm({...form, days:e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Post Limit</label>
                  <input type="number" min="1" className="form-control" value={form.postLimit} onChange={e=>setForm({...form, postLimit:e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Discount (%)</label>
                  <input type="number" min="0" max="100" className="form-control" value={form.discount} onChange={e=>setForm({...form, discount:Number(e.target.value)})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button className="btn btn-primary" disabled={saving} onClick={onSave}>
                  {saving ? <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</> : <><i className="fas fa-save me-2"></i>Save Plan</>}
                </button>
                {form._id && (
                  <button className="btn btn-danger" onClick={onDelete}>
                    <i className="fas fa-trash me-2"></i>Delete Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


