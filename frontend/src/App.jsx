import React, { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
const GST_RATE = 0.03
function currency(n){ return Number(n||0).toFixed(2) }

export default function App(){
  const API_BASE = window.location.origin + '/api'  // auto-detect backend
  const [items, setItems] = useState([])
  const [form, setForm] = useState({type:'silver', weight:'', rate:'', making:''})
  const [overrideTotal, setOverrideTotal] = useState('')
  const [customer, setCustomer] = useState({name:'', mobile:'', gstin:'23ALUPS4165P1Z5'})
  const [bills, setBills] = useState([])

  useEffect(()=>{ const s = localStorage.getItem('jp_items'); if(s) setItems(JSON.parse(s)); fetchBills(); },[])
  useEffect(()=> localStorage.setItem('jp_items', JSON.stringify(items)),[items])

  function addItem(){ const weight = parseFloat(form.weight)||0; const rate = form.rate===''? '': parseFloat(form.rate); const making = form.making===''? '': parseFloat(form.making); setItems(prev=>[...prev, {id:Date.now(), type:form.type, weight, rate, making}]); setForm({type:form.type, weight:'', rate:'', making:''}) }
  function removeItem(id){ setItems(prev=>prev.filter(i=>i.id!==id)) }
  function updateRate(id, r){ setItems(prev=> prev.map(it=> it.id===id? {...it, rate: r===''? '': parseFloat(r)}:it)) }

  const forward = useMemo(()=>{ const iv = items.map(it=>{ const rate = typeof it.rate==='number'? it.rate:0; const base = it.weight*rate; const makingTotal = it.type==='silver'? (it.weight*(it.making||0)) : (it.weight*rate*((it.making||0)/100)); const value=base+makingTotal; return {...it, usedRate:rate, base, makingTotal, value} }); const subtotal = iv.reduce((s,i)=>s+i.value,0); const gst = subtotal*GST_RATE; return {itemsValue:iv, subtotal, gst, total: subtotal+gst, sgst:gst/2, cgst:gst/2} },[items])
  const reverse = useMemo(()=>{ const t = parseFloat(overrideTotal); if(!t||items.length===0) return null; const subtotal = t/(1+GST_RATE); const makingTotals = items.reduce((s,it)=> s + (it.type==='silver'? (it.weight*(it.making||0)) : (it.weight*((it.rate||0)*((it.making||0)/100))) ),0); let fixed=0; items.forEach(it=>{ if(typeof it.rate==='number') fixed+=it.weight*it.rate }); const rem = Math.max(0, subtotal - makingTotals - fixed); const totalWeightNoRate = items.reduce((s,it)=> s + (typeof it.rate==='number' ? 0 : it.weight),0); const implicit = totalWeightNoRate>0 ? rem/totalWeightNoRate : 0; const derived = items.map(it=>{ const rate = typeof it.rate==='number'? it.rate : implicit; const base = it.weight*rate; const makingTotal = it.type==='silver'? (it.weight*(it.making||0)) : (it.weight*rate*((it.making||0)/100)); const value = base + makingTotal; return {...it, usedRate:rate, base, makingTotal, value} }); const recomputed = derived.reduce((s,i)=>s+i.value,0); const gst = recomputed*GST_RATE; return {itemsDerived:derived, subtotal:recomputed, gst, total:recomputed+gst, implicitRate:implicit} },[overrideTotal, items])

  const current = overrideTotal ? (reverse||{}) : forward

  function shareWhatsApp(){ const lines = []; lines.push('JP JEWELLERS - Bill'); lines.push('Customer: '+(customer.name||'')); lines.push('Items:'); (overrideTotal ? (reverse?.itemsDerived||[]) : forward.itemsValue).forEach(it=> lines.push(`${it.type} ${it.weight}g - ₹${currency(it.value)}`)); lines.push('Subtotal: ₹'+currency(current.subtotal||0)); lines.push('GST(3%): ₹'+currency(current.gst||0)); lines.push('Total: ₹'+currency(current.total||0)); const txt = encodeURIComponent(lines.join('\n')); const url = `https://wa.me/?text=${txt}`; window.open(url,'_blank') }

  async function saveBill(){
    const payload = { customer, items: (overrideTotal ? (reverse?.itemsDerived||[]) : forward.itemsValue), computed: current };
    try{ await axios.post(API_BASE + '/bills', payload); fetchBills(); alert('Saved') }catch(e){ alert('Failed to save: '+e.message) }
  }

  async function fetchBills(){
    try{ const res = await axios.get(API_BASE + '/bills'); setBills(res.data || []);}catch(e){ /* ignore */ }
  }

  return (<div style={{padding:16,maxWidth:980,margin:'0 auto',fontFamily:'Arial'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1>JP JEWELLERS — Billing</h1><div style={{fontSize:13,color:'#555'}}>GST 3% (1.5% SGST + 1.5% CGST)</div></header>
    <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:16,marginTop:12}}>
      <div>
        <section style={{border:'1px solid #eee',padding:10,borderRadius:8}}>
          <h3>Add Item</h3>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value='silver'>Silver</option><option value='gold'>Gold</option></select>
          <input type='number' placeholder='Weight (g)' value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})} />
          <input type='number' placeholder='Rate per g (leave blank)' value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} />
          {form.type==='silver'? <input type='number' placeholder='Making ₹/g' value={form.making} onChange={e=>setForm({...form,making:e.target.value})} /> : <input type='number' placeholder='Making %' value={form.making} onChange={e=>setForm({...form,making:e.target.value})} />}
          <div style={{marginTop:8}}><button onClick={addItem}>Add Item</button></div>
        </section>

        <section style={{marginTop:12,border:'1px solid #eee',padding:10,borderRadius:8}}>
          <h3>Items</h3>
          {(overrideTotal ? (reverse?.itemsDerived||[]) : forward.itemsValue).length === 0 && <div style={{color:'#666'}}>No items added</div>}
          {(overrideTotal ? (reverse?.itemsDerived||[]) : forward.itemsValue).map(it=>(
            <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:8,borderBottom:'1px dashed #eee'}}>
              <div>
                <div style={{fontWeight:600}}>{it.type.toUpperCase()} · {it.weight} g</div>
                <div style={{fontSize:13,color:'#666'}}>Rate: ₹{currency(it.usedRate||it.rate||0)} /g · Making: {it.type==='gold'? (it.making+'%') : ('₹'+currency(it.making))} · Value: ₹{currency(it.value)}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{ const r = prompt('Enter new rate per g (leave blank to clear)'); if(r===null) return; updateRate(it.id, r) }}>Edit Rate</button>
                <button onClick={()=>removeItem(it.id)}>Remove</button>
              </div>
            </div>
          ))}
        </section>

        <section style={{marginTop:12}}>
          <h3>Customer</h3>
          <input placeholder='Name' value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} />
          <input placeholder='Mobile' value={customer.mobile} onChange={e=>setCustomer({...customer,mobile:e.target.value})} />
          <div style={{marginTop:8,display:'flex',gap:8}}>
            <button onClick={saveBill}>Save Bill</button>
            <button onClick={shareWhatsApp}>Share on WhatsApp</button>
          </div>
        </section>
      </div>

      <aside>
        <section style={{border:'1px solid #eee',padding:10,borderRadius:8}}>
          <h3>Totals & Reverse Calc</h3>
          <label>Final Total (enter to force reverse calculation)</label>
          <input value={overrideTotal} onChange={e=>setOverrideTotal(e.target.value)} />
          <div style={{marginTop:8}}>
            <div>Subtotal: ₹{currency(current.subtotal||0)}</div>
            <div>GST (3%): ₹{currency(current.gst||0)}</div>
            <div>SGST: ₹{currency((current.gst||0)/2)} · CGST: ₹{currency((current.gst||0)/2)}</div>
            <div style={{fontWeight:700}}>Total: ₹{currency(current.total||0)}</div>
          </div>
        </section>

        <section style={{marginTop:12,border:'1px solid #eee',padding:10,borderRadius:8}}>
          <h3>Saved Bills</h3>
          <div style={{maxHeight:300,overflow:'auto'}}>
            {bills.length===0 && <div style={{color:'#666'}}>No saved bills</div>}
            {bills.map(b=> (<div key={b.id} style={{padding:6,borderBottom:'1px dashed #eee'}}><div style={{fontWeight:600}}>Bill #{b.id} · {new Date(b.created_at).toLocaleString()}</div><div style={{fontSize:13,color:'#666'}}>Customer: {b.customer?.name || ''} · Total: ₹{currency(b.computed?.total||0)}</div></div>))}
          </div>
        </section>
      </aside>
    </div>
  </div>)
}
