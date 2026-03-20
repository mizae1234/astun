"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2, Save, Plus, Trash2, Star, CreditCard,
  FileText, MapPin, Phone, Mail, Globe, Printer, ArrowLeft
} from "lucide-react";
import {
  getCompanySettings,
  updateCompanySettings,
  addBankAccount,
  deleteBankAccount,
  updateBankAccount,
} from "@/actions/settings";

const THAI_BANKS = [
  { code: "KBANK", name: "ธนาคารกสิกรไทย" },
  { code: "BBL", name: "ธนาคารกรุงเทพ" },
  { code: "KTB", name: "ธนาคารกรุงไทย" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์" },
  { code: "BAY", name: "ธนาคารกรุงศรีอยุธยา" },
  { code: "TTB", name: "ธนาคารทหารไทยธนชาต" },
  { code: "GSB", name: "ธนาคารออมสิน" },
  { code: "CIMB", name: "ธนาคาร ซีไอเอ็มบี ไทย" },
  { code: "LHFG", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์" },
  { code: "TISCO", name: "ธนาคารทิสโก้" },
  { code: "KKP", name: "ธนาคารเกียรตินาคินภัทร" },
  { code: "OTHER", name: "อื่นๆ" },
];

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Company form
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", taxId: "", logo: "",
    invoicePrefix: "", taxBranchCode: "", taxBranchName: "",
    invoiceAddress: "", invoiceNote: "", website: "", fax: "",
  });

  // Bank account form
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankCode: "", bankName: "", accountName: "", accountNumber: "",
    branchName: "", accountType: "ออมทรัพย์", isDefault: false,
  });

  useEffect(() => {
    if (companyId) {
      getCompanySettings(companyId).then((c: any) => {
        setCompany(c);
        if (c) {
          setForm({
            name: c.name || "", address: c.address || "", phone: c.phone || "",
            email: c.email || "", taxId: c.taxId || "", logo: c.logo || "",
            invoicePrefix: c.invoicePrefix || "", taxBranchCode: c.taxBranchCode || "",
            taxBranchName: c.taxBranchName || "", invoiceAddress: c.invoiceAddress || "",
            invoiceNote: c.invoiceNote || "", website: c.website || "", fax: c.fax || "",
          });
        }
      });
    }
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompanySettings(companyId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleAddBank = async () => {
    const bank = THAI_BANKS.find((b) => b.code === bankForm.bankCode);
    await addBankAccount(companyId, {
      ...bankForm,
      bankName: bank?.name || bankForm.bankName || bankForm.bankCode,
    });
    setShowBankForm(false);
    setBankForm({ bankCode: "", bankName: "", accountName: "", accountNumber: "", branchName: "", accountType: "ออมทรัพย์", isDefault: false });
    const c = await getCompanySettings(companyId);
    setCompany(c);
  };

  const handleDeleteBank = async (id: string) => {
    await deleteBankAccount(id);
    const c = await getCompanySettings(companyId);
    setCompany(c);
  };

  const handleSetDefault = async (id: string) => {
    await updateBankAccount(id, { isDefault: true });
    const c = await getCompanySettings(companyId);
    setCompany(c);
  };

  const InputField = ({ label, icon: Icon, value, field, placeholder, type = "text", span = 1 }: any) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/companies")}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">ตั้งค่าบริษัท</h2>
          <p className="text-sm text-gray-500">
            {company ? company.name : "กำลังโหลด..."}
            {" · "}ข้อมูลบริษัท, ภาษี, Invoice, บัญชีธนาคาร
          </p>
        </div>
      </div>

      {!company ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">กำลังโหลด...</div>
      ) : (
        <>
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-blue-600" /> ข้อมูลบริษัท
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="ชื่อบริษัท" icon={Building2} value={form.name} field="name" placeholder="บริษัท xxx จำกัด" />
              <InputField label="เว็บไซต์" icon={Globe} value={form.website} field="website" placeholder="https://..." />
              <InputField label="โทรศัพท์" icon={Phone} value={form.phone} field="phone" placeholder="02-xxx-xxxx" />
              <InputField label="แฟกซ์" icon={Printer} value={form.fax} field="fax" placeholder="02-xxx-xxxx" />
              <InputField label="อีเมล" icon={Mail} value={form.email} field="email" placeholder="info@company.com" type="email" />
              <InputField label="โลโก้ URL" value={form.logo} field="logo" placeholder="https://..." />
              <InputField label="ที่อยู่บริษัท" icon={MapPin} value={form.address} field="address" placeholder="ที่อยู่สำหรับใช้ทั่วไป" span={2} type="textarea" />
            </div>
          </div>

          {/* Tax & Invoice */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-emerald-600" /> ข้อมูลภาษีและ Invoice
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="เลขประจำตัวผู้เสียภาษี" value={form.taxId} field="taxId" placeholder="0-1234-56789-01-2" />
              <InputField label="Invoice Prefix" value={form.invoicePrefix} field="invoicePrefix" placeholder="INV-" />
              <InputField label="รหัสสาขา (สำหรับภาษี)" value={form.taxBranchCode} field="taxBranchCode" placeholder="00000" />
              <InputField label="ชื่อสาขา (สำหรับภาษี)" value={form.taxBranchName} field="taxBranchName" placeholder="สำนักงานใหญ่" />
              <InputField label="ที่อยู่ออก Invoice" icon={MapPin} value={form.invoiceAddress} field="invoiceAddress" placeholder="ถ้าต่างจากที่อยู่บริษัท..." span={2} type="textarea" />
              <InputField label="หมายเหตุท้าย Invoice" value={form.invoiceNote} field="invoiceNote" placeholder="เช่น เงื่อนไขการชำระเงิน..." span={2} type="textarea" />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : saved ? "✅ บันทึกแล้ว" : "บันทึกข้อมูลบริษัท"}
            </button>
          </div>

          {/* Bank Accounts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-purple-600" /> บัญชีธนาคาร / ช่องทางรับเงิน
              </h3>
              <button
                onClick={() => setShowBankForm(!showBankForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มบัญชี
              </button>
            </div>

            {/* Add bank form */}
            {showBankForm && (
              <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ธนาคาร</label>
                    <select
                      value={bankForm.bankCode}
                      onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">เลือกธนาคาร</option>
                      {THAI_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">เลขที่บัญชี</label>
                    <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="xxx-x-xxxxx-x" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ชื่อบัญชี</label>
                    <input type="text" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="บจก. xxx" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">สาขาธนาคาร</label>
                    <input type="text" value={bankForm.branchName} onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })} placeholder="สาขาสยาม" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">ประเภทบัญชี</label>
                    <select value={bankForm.accountType} onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none">
                      <option value="ออมทรัพย์">ออมทรัพย์</option>
                      <option value="กระแสรายวัน">กระแสรายวัน</option>
                      <option value="ฝากประจำ">ฝากประจำ</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={bankForm.isDefault} onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })} className="rounded border-gray-300" />
                      บัญชีหลัก (Default)
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowBankForm(false)} className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                  <button onClick={handleAddBank} className="px-4 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700">บันทึกบัญชี</button>
                </div>
              </div>
            )}

            {/* Bank list */}
            {company.bankAccounts?.length > 0 ? (
              <div className="space-y-2">
                {company.bankAccounts.map((acc: any) => (
                  <div key={acc.id} className={`flex items-center gap-4 p-4 rounded-xl border ${acc.isDefault ? "border-purple-200 bg-purple-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-lg">
                      🏦
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{acc.bankName}</p>
                        {acc.isDefault && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{acc.accountNumber} · {acc.accountName}</p>
                      <p className="text-xs text-gray-400">{acc.accountType} {acc.branchName && `· ${acc.branchName}`}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!acc.isDefault && (
                        <button onClick={() => handleSetDefault(acc.id)} className="p-1.5 text-gray-300 hover:text-purple-500" title="ตั้งเป็นบัญชีหลัก">
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteBank(acc.id)} className="p-1.5 text-gray-300 hover:text-red-500" title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-300 text-sm py-6">
                ยังไม่มีบัญชีธนาคาร
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
