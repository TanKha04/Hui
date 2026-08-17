const API_BASE = '/api';

export const api = {
  // Groups
  getGroups: async () => {
    const res = await fetch(`${API_BASE}/groups`);
    return await res.json();
  },

  getGroupDetail: async (id) => {
    const res = await fetch(`${API_BASE}/groups/${id}`);
    return await res.json();
  },

  createGroup: async (groupData) => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    return await res.json();
  },

  deleteGroup: async (id) => {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  setGroupPeriod: async (id, currentPeriod) => {
    const res = await fetch(`${API_BASE}/groups/${id}/set-period`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_period: currentPeriod }),
    });
    return await res.json();
  },

  // Members
  updateMember: async (memberId, memberData) => {
    const res = await fetch(`${API_BASE}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData),
    });
    return await res.json();
  },

  getMemberHistory: async (memberId) => {
    const res = await fetch(`${API_BASE}/members/${memberId}/history`);
    return await res.json();
  },

  payAllMemberDebt: async (memberId) => {
    const res = await fetch(`${API_BASE}/members/${memberId}/pay-all`, {
      method: 'POST',
    });
    return await res.json();
  },

  // Periods & Settle (Hốt Hụi)
  settlePeriod: async (groupId, periodNumber, winnerMemberId, bidAmount) => {
    const res = await fetch(`${API_BASE}/periods/${groupId}/${periodNumber}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner_member_id: winnerMemberId,
        bid_amount: bidAmount,
      }),
    });
    return await res.json();
  },

  unsettlePeriod: async (groupId, periodNumber) => {
    const res = await fetch(`${API_BASE}/periods/${groupId}/${periodNumber}/unsettle`, {
      method: 'POST',
    });
    return await res.json();
  },

  // Payments (Đóng Hụi)
  payHui: async (paymentData) => {
    const res = await fetch(`${API_BASE}/payments/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return await res.json();
  },

  unpayHui: async (paymentData) => {
    const res = await fetch(`${API_BASE}/payments/unpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    return await res.json();
  },

  // Gom Hui Dashboard
  getGomHuiSummary: async (date) => {
    const url = date ? `${API_BASE}/gom-hui?date=${encodeURIComponent(date)}` : `${API_BASE}/gom-hui`;
    const res = await fetch(url);
    return await res.json();
  },

  // System Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return await res.json();
  },

  saveSettings: async (settingsData) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    });
    return await res.json();
  },

  // Export Docx
  getExportDocxUrl: (groupId) => `${API_BASE}/groups/${groupId}/export-docx`,
};

export function formatVND(amount) {
  if (amount === undefined || amount === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
