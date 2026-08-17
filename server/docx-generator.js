const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' VNĐ';
}

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

async function generateHuiDocx(group, members, periods) {
  const memberParagraphs = members.map((m, idx) => {
    return new Paragraph({
      spacing: { before: 120, after: 120 },
      indent: { left: 720 }, // Indent ~0.5 inch
      children: [
        new TextRun({
          text: `${idx + 1}.  ${m.member_name || `Thành viên ${idx + 1}`}`,
          size: 28, // 14pt
          font: 'Times New Roman',
        }),
      ],
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header Line 1: Đầu Thảo [tên chủ hụi]
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: `Đầu Thảo ${group.host_name || 'Chủ Hụi'}`,
                bold: true,
                size: 32, // 16pt
                font: 'Times New Roman',
              }),
            ],
          }),

          // Header Line 2: Huội: [số tiền]
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 150 },
            children: [
              new TextRun({
                text: `Huội: ${formatVND(group.amount_per_member)}`,
                bold: true,
                size: 28, // 14pt
                font: 'Times New Roman',
              }),
            ],
          }),

          // Header Line 3: Khui ngày: [ngày]
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 400 },
            children: [
              new TextRun({
                text: `Khui ngày: ${formatDateVN(group.start_date)}`,
                size: 28, // 14pt
                font: 'Times New Roman',
              }),
            ],
          }),

          // Space before list
          new Paragraph({ text: '' }),

          // Numbered list of members
          ...memberParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateHuiDocx,
};
