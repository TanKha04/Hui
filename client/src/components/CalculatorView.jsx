import React, { useState } from 'react';
import { Calculator, ArrowRight, DollarSign, Sparkles, HelpCircle, CheckCircle2, Delete, RotateCcw, Copy, Check, Equal } from 'lucide-react';
import { formatVND } from '../services/api';

function safeEvaluate(expr) {
  if (!expr || !expr.trim()) return '';
  try {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100')
      .replace(/[^0-9+\-*/().\s]/g, '');

    if (!sanitized) return '';
    // Auto balance closing parentheses if needed
    const openCount = (sanitized.match(/\(/g) || []).length;
    const closeCount = (sanitized.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      sanitized += ')'.repeat(openCount - closeCount);
    }
    // eslint-disable-next-line no-new-func
    const fn = new Function(`'use strict'; return (${sanitized})`);
    const val = fn();
    if (val === undefined || val === null || isNaN(val) || !isFinite(val)) {
      return '';
    }
    return val;
  } catch (e) {
    return '';
  }
}

export default function CalculatorView() {
  // Part 1: Hui simulation calculator
  const [amount, setAmount] = useState(2000000);
  const [amountText, setAmountText] = useState('2.000.000');
  const [totalMembers, setTotalMembers] = useState(20);
  const [period, setPeriod] = useState(11);
  const [bidAmount, setBidAmount] = useState(200000);
  const [bidText, setBidText] = useState('200.000');
  const [commissionRate, setCommissionRate] = useState(0.5);

  // Part 2: Basic Arithmetic Calculator (+ - * / ())
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [copied, setCopied] = useState(false);

  const remainingMonths = Math.max(0, totalMembers - period);
  const basePot = (totalMembers - 1) * amount;
  const totalDiscount = remainingMonths * bidAmount;
  const commission = Math.round(amount * commissionRate);
  const netPayout = basePot - totalDiscount - commission;
  const livingMemberPay = Math.max(0, amount - bidAmount);
  const deadMemberPay = amount;

  const handleAmountChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setAmount(num);
    setAmountText(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
  };

  const handleBidChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setBidAmount(num);
    setBidText(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
  };

  // Calculator button click
  const handleKeyClick = (val) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
      return;
    }

    if (val === 'DEL') {
      const nextInput = calcInput.slice(0, -1);
      setCalcInput(nextInput);
      const evalRes = safeEvaluate(nextInput);
      setCalcResult(evalRes !== '' ? String(evalRes) : '');
      return;
    }

    if (val === '=') {
      const evalRes = safeEvaluate(calcInput);
      if (evalRes !== '') {
        setCalcInput(String(evalRes));
        setCalcResult('');
      }
      return;
    }

    const nextInput = calcInput + val;
    setCalcInput(nextInput);
    const evalRes = safeEvaluate(nextInput);
    setCalcResult(evalRes !== '' ? String(evalRes) : '');
  };

  const handleCopy = () => {
    const textToCopy = calcResult || calcInput;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Calculator className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MÁY TÍNH HỤI & TÍNH TOÁN CƠ BẢN</h1>
          <p className="text-xs text-slate-500 font-medium">
            Mô phỏng hốt hụi chuẩn xác và máy tính số học tiện ích (+, -, ×, ÷, đóng mở ngoặc)
          </p>
        </div>
      </div>

      {/* SECTION 1: HUI SIMULATION CALCULATOR */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-base font-extrabold text-slate-800">Máy Tính Hốt Hụi & Tiền Thảo Chủ Hụi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Parameters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Thông Số Dây Hụi
            </h3>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mệnh Giá 1 Phần Hụi</label>
              <div className="relative">
                <input
                  type="text"
                  value={amountText}
                  onChange={handleAmountChange}
                  className="w-full pl-4 pr-16 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>
            </div>

            {/* Total members & Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tổng Số Chân (Kỳ)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={totalMembers}
                  onChange={(e) => setTotalMembers(parseInt(e.target.value, 10) || 20)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kỳ Muốn Hốt (Tháng)</label>
                <input
                  type="number"
                  min="1"
                  max={totalMembers}
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Bid Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số Tiền Lời Kêu Thăm (Bỏ Giá)</label>
              <div className="relative">
                <input
                  type="text"
                  value={bidText}
                  onChange={handleBidChange}
                  className="w-full pl-4 pr-16 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Hoa Hồng Chủ Hụi (Thảo Hụi)</label>
              <select
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
              >
                <option value={0.5}>50% của 1 phần ({formatVND(amount * 0.5)})</option>
                <option value={0.4}>40% của 1 phần ({formatVND(amount * 0.4)})</option>
                <option value={0.3}>30% của 1 phần ({formatVND(amount * 0.3)})</option>
                <option value={1.0}>100% của 1 phần ({formatVND(amount)})</option>
                <option value={0}>0% (Không tính tiền thảo)</option>
              </select>
            </div>
          </div>

          {/* Calculation Result */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Kết Quả Tính Toán</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Kỳ {period}/{totalMembers}</span>
              </h3>

              {/* Big Net Payout Box */}
              <div className="mt-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                  Số Tiền Thực Hốt Được
                </div>
                <div className="text-3xl font-black text-emerald-600">
                  {formatVND(netPayout)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  (Đã trừ tiền lời các tháng còn lại và tiền thảo chủ hụi)
                </p>
              </div>

              {/* Formula items */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tiền huội gốc ({totalMembers - 1} phần × {formatVND(amount)}):</span>
                  <span className="font-bold text-slate-800">{formatVND(basePot)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                  <span>Trừ lời {remainingMonths} tháng còn lại ({remainingMonths} × {formatVND(bidAmount)}):</span>
                  <span className="font-bold">- {formatVND(totalDiscount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-600">
                  <span>Trừ hoa hồng chủ hụi (50%):</span>
                  <span className="font-bold">- {formatVND(commission)}</span>
                </div>
              </div>
            </div>

            {/* Members payment in this period */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800">Số Tiền Các Chân Khác Phải Đóng Ở Kỳ Này:</div>
              <div className="flex justify-between items-center text-slate-600">
                <span>• Chân hụi sống (chưa hốt):</span>
                <span className="font-bold text-blue-600">{formatVND(livingMemberPay)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>• Chân hụi chết (đã hốt các kỳ trước):</span>
                <span className="font-bold text-slate-800">{formatVND(deadMemberPay)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BASIC ARITHMETIC CALCULATOR (+ - * / ()) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-base font-extrabold text-slate-800">Máy Tính Số Học Cơ Bản (+, -, ×, ÷, Đóng Mở Ngoặc)</h2>
        </div>

        {/* Centered Clean Calculator Device */}
        <div className="max-w-xl mx-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700 text-white">
          {/* Calculator Display Screen */}
          <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 mb-6 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-medium">Biểu thức tính</span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer text-xs"
                title="Sao chép kết quả"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Expression input display */}
            <div className="text-slate-300 text-xl sm:text-2xl font-mono min-h-[36px] break-all overflow-x-auto text-right">
              {calcInput || '0'}
            </div>

            {/* Live result display */}
            <div className="text-emerald-400 text-2xl sm:text-3xl font-black font-mono text-right mt-1 min-h-[40px] flex items-center justify-end gap-2">
              {calcResult && (
                <span className="text-xs text-slate-400 font-sans font-semibold">
                  ≈ {formatVND(parseFloat(calcResult))}
                </span>
              )}
              <span>{calcResult || (calcInput ? '=' : '')}</span>
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-3">
            {/* Row 1 */}
            <button
              type="button"
              onClick={() => handleKeyClick('C')}
              className="py-4 rounded-2xl bg-rose-600/25 text-rose-400 hover:bg-rose-600 hover:text-white font-black text-sm transition-all active:scale-95 cursor-pointer border border-rose-500/30"
            >
              C (Xóa)
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('(')}
              className="py-4 rounded-2xl bg-slate-700/80 text-blue-300 hover:bg-slate-600 font-bold text-lg transition-all active:scale-95 cursor-pointer border border-slate-600"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick(')')}
              className="py-4 rounded-2xl bg-slate-700/80 text-blue-300 hover:bg-slate-600 font-bold text-lg transition-all active:scale-95 cursor-pointer border border-slate-600"
            >
              )
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('DEL')}
              className="py-4 rounded-2xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold text-sm transition-all active:scale-95 cursor-pointer border border-slate-600 flex items-center justify-center gap-1"
              title="Xóa 1 ký tự"
            >
              <Delete className="w-4 h-4" />
              <span>⌫</span>
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => handleKeyClick('7')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('8')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('9')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('÷')}
              className="py-4 rounded-2xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white font-black text-xl transition-all active:scale-95 cursor-pointer border border-amber-500/30"
            >
              ÷
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => handleKeyClick('4')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('5')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('6')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('×')}
              className="py-4 rounded-2xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white font-black text-xl transition-all active:scale-95 cursor-pointer border border-amber-500/30"
            >
              ×
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => handleKeyClick('1')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('2')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('3')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('-')}
              className="py-4 rounded-2xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white font-black text-xl transition-all active:scale-95 cursor-pointer border border-amber-500/30"
            >
              -
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('000')}
              className="py-4 rounded-2xl bg-slate-800 text-emerald-400 hover:bg-slate-700 font-extrabold text-base transition-all active:scale-95 cursor-pointer border border-slate-700/70"
              title="Bấm nhanh 3 số 0 (Nghìn/Triệu)"
            >
              000
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('.')}
              className="py-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-lg transition-all active:scale-95 cursor-pointer border border-slate-700/70"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('+')}
              className="py-4 rounded-2xl bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white font-black text-xl transition-all active:scale-95 cursor-pointer border border-amber-500/30"
            >
              +
            </button>
          </div>

          {/* Row 6: Percent & Equal Button */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <button
              type="button"
              onClick={() => handleKeyClick('%')}
              className="py-4 rounded-2xl bg-slate-700/80 text-blue-300 hover:bg-slate-600 font-bold text-lg transition-all active:scale-95 cursor-pointer border border-slate-600"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('=')}
              className="col-span-3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xl transition-all shadow-lg shadow-blue-500/30 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Equal className="w-6 h-6" />
              <span>Bằng (=)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
