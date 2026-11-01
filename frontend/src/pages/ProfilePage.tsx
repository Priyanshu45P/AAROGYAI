import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth";

export function ProfilePage() {
  const store = useAuthStore();
  const [form,setForm]=useState<any>({});
  const [message,setMessage]=useState("");
  useEffect(()=>{api.get('/auth/me').then(r=>{const p=r.data.user.patientProfile;setForm({firstName:r.data.user.firstName,lastName:r.data.user.lastName,dateOfBirth:p?.dateOfBirth?.slice(0,10)??'',sex:p?.sex??'',phone:p?.phone??'',address:p?.address??'',heightCm:p?.heightCm??''});});},[]);
  async function submit(e:FormEvent){e.preventDefault();await api.patch('/profile/account',{firstName:form.firstName,lastName:form.lastName});await api.patch('/profile/patient',{dateOfBirth:form.dateOfBirth||undefined,sex:form.sex||undefined,phone:form.phone||undefined,address:form.address||undefined,heightCm:form.heightCm?Number(form.heightCm):undefined});setMessage('Profile updated.'); if(store.user) store.login(store.token!,{...store.user,firstName:form.firstName,lastName:form.lastName});}
  return <><div className="page-heading"><div><h1>Profile</h1><p>Keep important personal details accurate.</p></div></div><form className="card profile-form" onSubmit={submit}><div className="two-col"><label>First name<input value={form.firstName??''} onChange={e=>setForm({...form,firstName:e.target.value})}/></label><label>Last name<input value={form.lastName??''} onChange={e=>setForm({...form,lastName:e.target.value})}/></label><label>Date of birth<input type="date" value={form.dateOfBirth??''} onChange={e=>setForm({...form,dateOfBirth:e.target.value})}/></label><label>Sex<input value={form.sex??''} onChange={e=>setForm({...form,sex:e.target.value})}/></label><label>Phone<input value={form.phone??''} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Height (cm)<input type="number" value={form.heightCm??''} onChange={e=>setForm({...form,heightCm:e.target.value})}/></label></div><label>Address<textarea value={form.address??''} onChange={e=>setForm({...form,address:e.target.value})}/></label>{message&&<p className="success-text">{message}</p>}<button className="primary">Save profile</button></form></>;
}
