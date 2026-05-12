'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  HeadingLevel, PageBreak, Header, Footer, PageNumber, LevelFormat,
  UnderlineType
} = require('docx');
const fs = require('fs');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGE_W   = 11906; // A4 DXA
const PAGE_H   = 16838;
const MARGIN   = 1134; // ~2cm
const CONTENT_W = PAGE_W - MARGIN * 2; // 9638

const ORANGE   = 'FF5500';
const BLACK    = '0A0908';
const GREY_BG  = 'F5F3EF';
const GREY_RULE= 'DDDDDD';
const WHITE    = 'FFFFFF';
const ORANGE_LIGHT = 'FFF0E8';
const AMBER_BG = 'FFF8F0';

const FONT     = 'Calibri';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function noBorder() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: none, bottom: none, left: none, right: none, insideH: none, insideV: none };
}

function thinBorder(color = GREY_RULE) {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

function rule(color = GREY_RULE, spaceAfter = 200) {
  return new Paragraph({
    spacing: { before: 160, after: spaceAfter },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } }
  });
}

function spacer(pt = 120) {
  return new Paragraph({ spacing: { before: 0, after: pt } });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 0, after: opts.after || 80 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({
      text,
      font: FONT,
      size: opts.size || 22,
      bold: opts.bold || false,
      italics: opts.italic || false,
      color: opts.color || BLACK,
    })]
  });
}

function orangeHeading(num, title) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    children: [
      new TextRun({ text: `${num}  `, font: FONT, size: 28, bold: true, color: ORANGE }),
      new TextRun({ text: title.toUpperCase(), font: FONT, size: 28, bold: true, color: BLACK }),
    ]
  });
}

function subHeading(text, color = ORANGE) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 19, bold: true, color })]
  });
}

function instruction(text) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: '666666' })]
  });
}

function writeLineLabel(label, lineCount = 1) {
  const rows = [];
  rows.push(new Paragraph({
    spacing: { before: 120, after: 20 },
    children: [new TextRun({ text: label, font: FONT, size: 19, bold: true, color: BLACK })]
  }));
  for (let i = 0; i < lineCount; i++) {
    rows.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } },
      children: [new TextRun({ text: ' ', font: FONT, size: 26 })]
    }));
    rows.push(spacer(80));
  }
  return rows;
}

function writeBox(label, lines = 3) {
  const cellChildren = [
    new Paragraph({
      spacing: { before: 60, after: 80 },
      children: [new TextRun({ text: label, font: FONT, size: 19, bold: true, color: ORANGE })]
    })
  ];
  for (let i = 0; i < lines; i++) {
    cellChildren.push(new Paragraph({
      spacing: { before: 0, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } },
      children: [new TextRun({ text: ' ', font: FONT, size: 26 })]
    }));
    cellChildren.push(spacer(60));
  }
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    margins: { top: 80, bottom: 80, left: 0, right: 0 },
    borders: noBorder(),
    rows: [new TableRow({ children: [
      new TableCell({
        borders: thinBorder(GREY_RULE),
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { fill: GREY_BG, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        children: cellChildren,
      })
    ]})]
  });
}

function checkboxLine(items) {
  // Returns a paragraph with checkbox + label for each item
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: items.flatMap((item, i) => [
      new TextRun({ text: '☐  ', font: FONT, size: 22 }),
      new TextRun({ text: item, font: FONT, size: 22, color: BLACK }),
      new TextRun({ text: i < items.length - 1 ? '        ' : '', font: FONT, size: 22 }),
    ])
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── VALUES DATA ──────────────────────────────────────────────────────────────
const VALUES = [
  ['Clarity',        'Makes expectations, decisions, and direction easy to understand.'],
  ['Courage',        'Acts on what is right even when it is uncomfortable or uncertain.'],
  ['Compassion',     'Recognises and responds to the human experience in others.'],
  ['Accountability', 'Takes ownership of outcomes and follows through on commitments.'],
  ['Integrity',      'Behaves consistently with stated values, especially under pressure.'],
  ['Trust',          'Builds confidence through reliability, honesty, and transparency.'],
  ['Collaboration',  'Works with others to achieve outcomes no one could reach alone.'],
  ['Innovation',     'Seeks new approaches and is willing to experiment and adapt.'],
  ['Inclusion',      'Ensures every voice is heard and everyone can contribute fully.'],
  ['Excellence',     'Sets and pursues high standards in everything that matters.'],
  ['Learning',       'Stays curious, open to feedback, and committed to growth.'],
  ['Adaptability',   'Responds well to change and adjusts approach when needed.'],
  ['Service',        'Puts the needs of others and the wider mission above personal gain.'],
  ['Ambition',       'Drives towards bold goals and encourages others to aim high.'],
  ['Wellbeing',      'Protects the physical, emotional, and mental health of self and others.'],
  ['Respect',        'Treats every person with dignity regardless of role or status.'],
  ['Curiosity',      'Asks questions, explores ideas, and challenges assumptions.'],
  ['Fairness',       'Applies consistent principles and treats people equitably.'],
  ['Transparency',   'Shares information openly and is honest about uncertainty.'],
  ['Responsibility', 'Fulfils obligations to people, systems, and the wider world.'],
  ['Creativity',     'Brings imagination and originality to problems and possibilities.'],
  ['Community',      'Builds belonging and strengthens the connections between people.'],
  ['Sustainability', 'Considers long-term impact on people, environment, and systems.'],
  ['Resilience',     'Maintains focus and recovers well from setbacks and pressure.'],
  ['Purpose',        'Acts from a clear sense of meaning and direction.'],
  ['Humility',       'Stays open to being wrong and values others’ perspectives.'],
  ['Decisiveness',   'Makes clear, timely decisions even with incomplete information.'],
  ['Patience',       'Gives things the time they need and resists the urge to rush.'],
  ['Discipline',     'Maintains structure, consistency, and focus over time.'],
  ['Empathy',        'Understands others’ feelings and perspectives without judgement.'],
  ['Challenge',      'Pushes people and ideas to be better through honest questioning.'],
  ['Stability',      'Provides consistency and calm that others can rely on.'],
  ['Growth',         'Develops capability in self and others over time.'],
  ['Recognition',    'Acknowledges the contributions and achievements of others.'],
  ['Independence',   'Thinks and acts from personal conviction rather than conformity.'],
  ['Connection',     'Builds genuine relationships grounded in trust and presence.'],
  ['Wisdom',         'Draws on experience and reflection to make sound judgements.'],
  ['Hope',           'Maintains belief in a better future and inspires others to do the same.'],
  ['Agility',        'Moves and thinks quickly in response to changing circumstances.'],
  ['Evidence',       'Grounds decisions in data, research, and honest enquiry.'],
  ['Belonging',      'Creates spaces where people feel genuinely included and valued.'],
  ['Simplicity',     'Cuts through complexity to find what really matters.'],
  ['Influence',      'Shapes thinking and direction through ideas and relationships.'],
  ['Reflection',     'Takes time to consider experience and learn from it.'],
  ['Consistency',    'Behaves reliably so others know what to expect.'],
  ['Boldness',       'Takes risks in service of meaningful change.'],
  ['Care',           'Attends to the needs of people with warmth and attention.'],
  ['Legacy',         'Builds something that will matter beyond the present moment.'],
];

// ─── VALUES TABLE ─────────────────────────────────────────────────────────────
// 2 columns: [value+description | VI/SI boxes] × 2 side-by-side
// Actually: 1 wide table, 4 cols: name+desc, VI, SI | gap | name+desc, VI, SI
// Simpler: single table, 6 cols per row (2 values per row)

function viSiCell(w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'EEEEEE' }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: '☐', font: FONT, size: 22, color: ORANGE })]
    })]
  });
}

function valueCell(name, desc, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'EEEEEE' }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 80 },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 20 },
        children: [new TextRun({ text: name, font: FONT, size: 20, bold: true, color: BLACK })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: desc, font: FONT, size: 17, color: '666666', italics: true })]
      }),
    ]
  });
}

function labelCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
    shading: { fill: GREY_BG, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, font: FONT, size: 16, bold: true, color: ORANGE })]
    })]
  });
}

function gapCell(w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: noBorder(),
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    children: [new Paragraph({ children: [new TextRun('')] })]
  });
}

function buildValuesTable() {
  // Layout per row: [desc 3200 | VI 340 | SI 340] gap [desc 3200 | VI 340 | SI 340]
  // Total = 3200+340+340 + gap200 + 3200+340+340 = 7960 + 200 = 8160... adjust
  const descW = 3150;
  const boxW  = 320;
  const gapW  = 380;
  const rowW  = descW + boxW + boxW;
  // Total = 2*(descW+boxW+boxW) + gapW = 2*3790 + 380 = 7960
  const totalW = 2 * (descW + boxW + boxW) + gapW; // 7960 -- fits within CONTENT_W

  const headerBg = { fill: BLACK, type: ShadingType.CLEAR };
  const headerBorderB = { style: BorderStyle.SINGLE, size: 6, color: ORANGE };
  const noneB = { style: BorderStyle.NONE, size: 0, color: WHITE };

  function headerCell(text, w, isGap = false) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: headerBorderB, left: noneB, right: noneB },
      shading: isGap ? { fill: WHITE, type: ShadingType.CLEAR } : headerBg,
      margins: { top: 80, bottom: 80, left: 100, right: 80 },
      children: [new Paragraph({
        alignment: isGap ? AlignmentType.LEFT : AlignmentType.CENTER,
        children: [new TextRun({ text, font: FONT, size: isGap ? 1 : 17, bold: true, color: isGap ? WHITE : WHITE })]
      })]
    });
  }

  const rows = [];

  // Header row
  rows.push(new TableRow({ children: [
    headerCell('VALUE', descW, false),
    headerCell('VI', boxW, false),
    headerCell('SI', boxW, false),
    headerCell('', gapW, true),
    headerCell('VALUE', descW, false),
    headerCell('VI', boxW, false),
    headerCell('SI', boxW, false),
  ]}));

  // Value rows — 2 per row
  for (let i = 0; i < VALUES.length; i += 2) {
    const left  = VALUES[i];
    const right = VALUES[i + 1] || null;
    const rowShade = Math.floor(i / 2) % 2 === 0 ? WHITE : 'FAFAF8';

    function vc(name, desc, w) {
      return new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: { top: noneB, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'E8E8E8' }, left: noneB, right: noneB },
        shading: { fill: rowShade, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 80 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 16 }, children: [new TextRun({ text: name, font: FONT, size: 20, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: desc, font: FONT, size: 17, italics: true, color: '777777' })] }),
        ]
      });
    }

    function bc(w) {
      return new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: { top: noneB, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'E8E8E8' }, left: noneB, right: noneB },
        shading: { fill: rowShade, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', font: FONT, size: 24, color: ORANGE })] })]
      });
    }

    function gc(w) {
      return new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: noBorder(),
        shading: { fill: WHITE, type: ShadingType.CLEAR },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [new Paragraph({ children: [new TextRun('')] })]
      });
    }

    const rightCells = right
      ? [vc(right[0], right[1], descW), bc(boxW), bc(boxW)]
      : [vc('', '', descW), bc(boxW), bc(boxW)];

    rows.push(new TableRow({ children: [
      vc(left[0], left[1], descW), bc(boxW), bc(boxW),
      gc(gapW),
      ...rightCells,
    ]}));
  }

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: [descW, boxW, boxW, gapW, descW, boxW, boxW],
    rows,
  });
}

// Custom value rows
function customValueRow(label) {
  const descW = 3150, boxW = 320, gapW = 380;
  const noneB = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const btmB  = { style: BorderStyle.SINGLE, size: 3, color: 'E8E8E8' };

  function customInputCell(w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: btmB, left: noneB, right: noneB },
      shading: { fill: ORANGE_LIGHT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 100, right: 80 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 10 }, children: [new TextRun({ text: label + '  ', font: FONT, size: 18, bold: true, color: ORANGE }), new TextRun({ text: '(write your own)', font: FONT, size: 17, italics: true, color: '999999' })] }),
        new Paragraph({ spacing: { before: 20, after: 20 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 22 })] }),
      ]
    });
  }

  function emptyBox(w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: btmB, left: noneB, right: noneB },
      shading: { fill: ORANGE_LIGHT, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 60, right: 60 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', font: FONT, size: 24, color: ORANGE })] })]
    });
  }

  function gapCell2(w) {
    return new TableCell({ width: { size: w, type: WidthType.DXA }, borders: noBorder(), shading: { fill: WHITE, type: ShadingType.CLEAR }, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new Paragraph({ children: [new TextRun('')] })] });
  }

  return new TableRow({ children: [
    customInputCell(descW), emptyBox(boxW), emptyBox(boxW),
    gapCell2(gapW),
    customInputCell(descW), emptyBox(boxW), emptyBox(boxW),
  ]});
}

// ─── SECTION BUILDERS ─────────────────────────────────────────────────────────

function buildCoverPage() {
  return [
    spacer(800),
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: 'VISIONING', font: FONT, size: 96, bold: true, color: ORANGE })]
    }),
    rule(ORANGE, 160),
    new Paragraph({
      spacing: { before: 80, after: 120 },
      children: [new TextRun({ text: 'Leadership Values  ·  Future Thinking  ·  Shared Action', font: FONT, size: 26, color: '444444' })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 600 },
      children: [new TextRun({ text: 'University of Plymouth  ·  Leadership Programme', font: FONT, size: 22, bold: true, color: BLACK })]
    }),
    // Shaded note box
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: ORANGE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
        shading: { fill: GREY_BG, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 240, right: 240 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: 'About this handout', font: FONT, size: 22, bold: true, color: ORANGE })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'This handout is your personal record of the Visioning experience. Use it to capture your thinking at each stage. Your facilitator will guide each section. You do not need to complete everything independently — this is a companion to the session, not a standalone guide.', font: FONT, size: 22, color: BLACK })] }),
        ]
      })]})],
    }),
    spacer(400),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: 'Experience 5', font: FONT, size: 20, color: '999999', italics: true })]
    }),
    pageBreak(),
  ];
}

function buildSection1() {
  const valTable = buildValuesTable();
  // Custom rows share same column widths
  const customTable = new Table({
    width: { size: 2 * (3150 + 320 + 320) + 380, type: WidthType.DXA },
    columnWidths: [3150, 320, 320, 380, 3150, 320, 320],
    rows: [
      customValueRow('Custom Value 1'),
      customValueRow('Custom Value 2'),
    ],
  });

  return [
    orangeHeading('01 /', 'Values Sort'),
    rule(ORANGE),
    instruction('Your facilitator will introduce the 48 leadership values. Read through all of them first, then mark each one using the boxes on the right.'),
    new Paragraph({
      spacing: { before: 80, after: 140 },
      children: [
        new TextRun({ text: '☐ VI', font: FONT, size: 21, bold: true, color: ORANGE }),
        new TextRun({ text: '  =  Very Important to your leadership          ', font: FONT, size: 21, color: BLACK }),
        new TextRun({ text: '☐ SI', font: FONT, size: 21, bold: true, color: BLACK }),
        new TextRun({ text: '  =  Somewhat Important to your leadership', font: FONT, size: 21, color: BLACK }),
      ]
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'Aim for a roughly equal split — around 24 values in each group. This is not about what sounds good. It is about what genuinely drives your decisions.', font: FONT, size: 20, italics: true, color: '666666' })]
    }),
    valTable,
    spacer(120),
    new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: 'Your own values', font: FONT, size: 20, bold: true, color: ORANGE })] }),
    instruction('If a value that matters to you is not listed above, add it in the space below.'),
    customTable,
    pageBreak(),
  ];
}

function buildSection2() {
  const items = [];
  for (let i = 1; i <= 10; i++) {
    items.push(new Paragraph({
      spacing: { before: 140, after: 0 },
      children: [
        new TextRun({ text: `${i}.  `, font: FONT, size: 22, bold: true, color: ORANGE }),
        new TextRun({ text: '_'.repeat(60), font: FONT, size: 22, color: GREY_RULE }),
      ]
    }));
    items.push(new Paragraph({
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({ text: '     Why this matters to me:  ', font: FONT, size: 18, italics: true, color: '888888' }),
        new TextRun({ text: '_'.repeat(50), font: FONT, size: 18, color: GREY_RULE }),
      ]
    }));
    items.push(spacer(40));
  }
  return [
    orangeHeading('02 /', 'Ranking Your Top 10'),
    rule(ORANGE),
    instruction("From your ‘Very Important’ values, select and rank your top 10. Write them in order below — 1 being the most important to your leadership right now."),
    spacer(80),
    ...items,
    pageBreak(),
  ];
}

function buildSection3() {
  function edgeBox(label) {
    return new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        borders: { top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE }, bottom: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, left: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, right: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE } },
        shading: { fill: WHITE, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 200, left: 240, right: 240 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: label, font: FONT, size: 22, bold: true, color: ORANGE })] }),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'Value name:', font: FONT, size: 20, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 30 })] }),
          spacer(160),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'What this looks like in practice:', font: FONT, size: 20, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }),
          spacer(40),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }),
          spacer(160),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'What happens when this value is under pressure:', font: FONT, size: 20, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }),
          spacer(40),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }),
          spacer(40),
        ]
      })]})],
    });
  }

  return [
    orangeHeading('03 /', 'Edge Values'),
    rule(ORANGE),
    instruction('From your Top 10, choose the 2 values that are most visible in your day-to-day leadership — the ones others would immediately notice if they disappeared.'),
    spacer(120),
    edgeBox('Edge Value 1'),
    spacer(200),
    edgeBox('Edge Value 2'),
    pageBreak(),
  ];
}

function buildSection4() {
  function gameBox(title, instruction_text, fields) {
    const children = [
      new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title.toUpperCase(), font: FONT, size: 20, bold: true, color: ORANGE })] }),
      new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: instruction_text, font: FONT, size: 20, italics: true, color: '666666' })] }),
    ];
    fields.forEach(({ label, lines }) => {
      children.push(new Paragraph({ spacing: { before: 80, after: 20 }, children: [new TextRun({ text: label, font: FONT, size: 19, bold: true, color: BLACK })] }));
      for (let i = 0; i < lines; i++) {
        children.push(new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }));
        children.push(spacer(50));
      }
    });
    return new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        borders: { top: noBorder().top, bottom: noBorder().bottom, left: { style: BorderStyle.SINGLE, size: 12, color: ORANGE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
        shading: { fill: GREY_BG, type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 240, right: 200 },
        children,
      })]})],
    });
  }

  return [
    orangeHeading('04 /', 'The Visioning Game'),
    rule(ORANGE),
    instruction('This section is played as a group exercise. Your facilitator will assign roles and introduce a theme. Use this space to capture key ideas as they emerge.'),
    spacer(120),

    subHeading('4A — Your Role', BLACK),
    checkboxLine(['Visionary', 'Catalyst', 'Challenger', 'Supporter']),
    spacer(60),
    ...writeLineLabel('The theme we are working with:', 1),
    spacer(160),

    gameBox(
      '4B — Pitch (Visionary)',
      'The Visionary opens with “Yes, we will…” and describes a future scenario in vivid, present-tense language.',
      [{ label: 'Notes from the Pitch:', lines: 4 }]
    ),
    spacer(160),

    gameBox(
      '4C — Grow (Supporters + Catalyst + Challenger)',
      'Supporters build on the idea. The Catalyst introduces an opportunity. The Challenger raises a real-world obstacle.',
      [
        { label: 'Ideas that emerged:', lines: 3 },
        { label: 'Catalyst opportunity:', lines: 2 },
        { label: 'Challenge raised:', lines: 2 },
      ]
    ),
    spacer(160),

    gameBox(
      '4D — Imagine (Group)',
      'The Visionary guides the group into a vivid image of the achieved future. Discuss together as a group.',
      [
        { label: 'What was different in this future?', lines: 2 },
        { label: 'What did it feel like to achieve the vision?', lines: 2 },
        { label: 'One next step we identified:', lines: 2 },
      ]
    ),
    pageBreak(),
  ];
}

function buildSection5() {
  function qBox(num, label, hint, lines = 3) {
    const children = [
      new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({ text: `${num}.  `, font: FONT, size: 21, bold: true, color: ORANGE }),
          new TextRun({ text: label, font: FONT, size: 21, bold: true, color: BLACK }),
          new TextRun({ text: `  —  ${hint}`, font: FONT, size: 19, italics: true, color: '888888' }),
        ]
      }),
    ];
    for (let i = 0; i < lines; i++) {
      children.push(new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }));
      children.push(spacer(40));
    }
    return children;
  }

  const systemsBox = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: thinBorder(GREY_RULE),
      shading: { fill: GREY_BG, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 240, right: 240 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'THREE SYSTEMS CHECK', font: FONT, size: 20, bold: true, color: ORANGE })] }),
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: '⚡ Drive:  ', font: FONT, size: 20, bold: true, color: BLACK }), new TextRun({ text: 'What in this vision activates energy and ambition?', font: FONT, size: 20, italics: true, color: '666666' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
        spacer(100),
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: '⚠ Threat:  ', font: FONT, size: 20, bold: true, color: BLACK }), new TextRun({ text: 'What might trigger a protective or controlling response?', font: FONT, size: 20, italics: true, color: '666666' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
        spacer(100),
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: '◎ Soothing:  ', font: FONT, size: 20, bold: true, color: BLACK }), new TextRun({ text: 'What in this vision creates steadiness and perspective?', font: FONT, size: 20, italics: true, color: '666666' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
        spacer(40),
      ]
    })]})],
  });

  return [
    orangeHeading('05 /', 'Real Vision Builder'),
    rule(ORANGE),
    instruction('Now you move from imagination to intention. Answer each question individually, then share with the group.'),
    spacer(100),
    ...qBox(1,  'Our vision goal',                  'What is the future we are building? Be specific.', 2),
    ...qBox(2,  'The Pitch',                         'Complete: “In [timeframe], we will have…”', 2),
    ...qBox(3,  'Who needs to be involved',          'Name people, teams, or groups.', 2),
    ...qBox(4,  'What makes this meaningful',        'Why does it matter — to you, to others, to the future?', 2),
    ...qBox(5,  'First step for less motivated people', 'What is the lowest-barrier entry point into this vision?', 2),
    spacer(80),
    ...qBox(6,  'Visible signs in 2035',             'What would we see, hear, and experience if the vision is achieved?', 3),
    ...qBox(7,  'Conversations that would be different', 'What would people be saying?', 2),
    ...qBox(8,  'Decisions that would change',       'What would leaders do differently?', 2),
    ...qBox(9,  'Behaviours that would shift',       'What would people start, stop, or do more of?', 2),
    ...qBox(10, 'The impact',                        'Who benefits, and how?', 2),
    spacer(160),
    systemsBox,
    pageBreak(),
  ];
}

function buildSection6() {
  const timePoints = ['Now', 'Next 30 days', '3 months', '6 months', '12 months', '2 years', '5 years', '2035'];
  const colT = 1600, colD = 5800, colTy = 2000;
  const noneB = { style: BorderStyle.NONE, size: 0, color: WHITE };
  const lineB = { style: BorderStyle.SINGLE, size: 3, color: 'E0E0E0' };

  function headerCell(text, w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE }, left: noneB, right: noneB },
      shading: { fill: BLACK, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, font: FONT, size: 19, bold: true, color: WHITE })] })]
    });
  }

  function tpCell(text, w, shade) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: { style: BorderStyle.SINGLE, size: 3, color: 'E0E0E0' }, left: noneB, right: { style: BorderStyle.SINGLE, size: 3, color: 'E0E0E0' } },
      shading: { fill: shade, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: 19, bold: true, color: BLACK })] })]
    });
  }

  function writeCell(w, shade) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: lineB, left: noneB, right: noneB },
      shading: { fill: shade, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: ' ', font: FONT, size: 28 })] })]
    });
  }

  function typeCell(w, shade) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: noneB, bottom: lineB, left: { style: BorderStyle.SINGLE, size: 3, color: 'E0E0E0' }, right: noneB },
      shading: { fill: shade, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'T / O / A', font: FONT, size: 16, italics: true, color: '999999' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: '(circle one)', font: FONT, size: 15, italics: true, color: 'BBBBBB' })] }),
      ]
    });
  }

  const rows = [
    new TableRow({ children: [headerCell('Time Point', colT), headerCell('Description', colD), headerCell('Type  (T = Target, O = Obstacle, A = Action)', colTy)] }),
    ...timePoints.map((tp, i) => {
      const shade = i % 2 === 0 ? WHITE : 'FAFAF8';
      return new TableRow({ children: [tpCell(tp, colT, shade), writeCell(colD, shade), typeCell(colTy, shade)] });
    }),
  ];

  return [
    orangeHeading('06 /', 'Timeline'),
    rule(ORANGE),
    instruction('Map out the key steps, obstacles, and actions between now and your vision. Write each item in the relevant row. Your facilitator will guide the timeframe.'),
    spacer(100),
    new Table({ width: { size: colT + colD + colTy, type: WidthType.DXA }, columnWidths: [colT, colD, colTy], rows }),
    spacer(160),
    ...writeLineLabel('What becomes possible after the vision is achieved?', 2),
    pageBreak(),
  ];
}

function buildSection7() {
  function commitBox(n) {
    const noneB = { style: BorderStyle.NONE, size: 0, color: WHITE };
    return new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        borders: thinBorder(GREY_RULE),
        shading: { fill: n % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 220, right: 220 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: `Person ${n}`, font: FONT, size: 19, bold: true, color: ORANGE })] }),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'Name:', font: FONT, size: 19, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
          spacer(80),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'My commitment:', font: FONT, size: 19, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
          spacer(40),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
          spacer(80),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'By when:', font: FONT, size: 19, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
          spacer(80),
          new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'Support I need:', font: FONT, size: 19, bold: true, color: BLACK })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 24 })] }),
          spacer(100),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: '☐  I commit to this', font: FONT, size: 21, bold: true, color: BLACK })] }),
        ]
      })]})],
    });
  }

  return [
    orangeHeading('07 /', 'Commitment'),
    rule(ORANGE),
    instruction('Each person states one personal commitment to the vision. Be specific. Name what you will do, by when, and what support you need.'),
    spacer(120),
    commitBox(1), spacer(120),
    commitBox(2), spacer(120),
    commitBox(3),
    pageBreak(),
    commitBox(4), spacer(120),
    commitBox(5), spacer(120),
    commitBox(6),
    pageBreak(),
  ];
}

function buildSection8() {
  const formulaBox = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE }, bottom: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, left: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, right: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE } },
      shading: { fill: AMBER_BG, type: ShadingType.CLEAR },
      margins: { top: 180, bottom: 180, left: 240, right: 240 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'THE FORMULA', font: FONT, size: 19, bold: true, color: ORANGE })] }),
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'GUIDED BY ', font: FONT, size: 22, bold: true, color: ORANGE }), new TextRun({ text: '[your values anchor — what you stand for]', font: FONT, size: 21, color: '666666', italics: true })] }),
        new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'WE WILL ', font: FONT, size: 22, bold: true, color: BLACK }), new TextRun({ text: '[your goal — the specific future you are building]', font: FONT, size: 21, color: '666666', italics: true })] }),
        new Paragraph({ spacing: { before: 0, after: 140 }, children: [new TextRun({ text: 'BY ', font: FONT, size: 22, bold: true, color: BLACK }), new TextRun({ text: '[your agency — the behaviour and actions that create it]', font: FONT, size: 21, color: '666666', italics: true })] }),
        new Paragraph({ spacing: { before: 0, after: 40 }, border: { top: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE } }, children: [new TextRun('')] }),
        new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: 'Values anchor: ', font: FONT, size: 19, bold: true, color: ORANGE }), new TextRun({ text: 'Use the language of your Edge Values. Ground it in what the group actually believes.', font: FONT, size: 18, color: '666666' })] }),
        new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: 'Goal: ', font: FONT, size: 19, bold: true, color: BLACK }), new TextRun({ text: 'Name the concrete future. If you can observe or measure it, write that.', font: FONT, size: 18, color: '666666' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Agency: ', font: FONT, size: 19, bold: true, color: BLACK }), new TextRun({ text: '“By creating…” beats “by trying to…” every time. Name the behaviour, not the intention.', font: FONT, size: 18, color: '666666' })] }),
      ]
    })]})],
  });

  function msLine(prefix, lines = 1) {
    const rows = [
      new Paragraph({ spacing: { before: 140, after: 20 }, children: [new TextRun({ text: prefix, font: FONT, size: 21, bold: true, color: prefix === 'Guided by' ? ORANGE : BLACK })] }),
    ];
    for (let i = 0; i < lines; i++) {
      rows.push(new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 26 })] }));
      rows.push(spacer(50));
    }
    return rows;
  }

  const fullBox = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.SINGLE, size: 8, color: ORANGE }, bottom: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, left: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE }, right: { style: BorderStyle.SINGLE, size: 3, color: GREY_RULE } },
      shading: { fill: WHITE, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 200, left: 240, right: 240 },
      children: [
        new Paragraph({ spacing: { before: 0, after: 100 }, children: [new TextRun({ text: 'OUR MISSION STATEMENT', font: FONT, size: 19, bold: true, color: ORANGE })] }),
        new Paragraph({ spacing: { before: 0, after: 20 }, children: [new TextRun({ text: 'Write the combined sentence here:', font: FONT, size: 19, italics: true, color: '888888' })] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 32 })] }),
        spacer(60),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 32 })] }),
        spacer(60),
        new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } }, children: [new TextRun({ text: ' ', font: FONT, size: 32 })] }),
        spacer(40),
      ]
    })]})],
  });

  return [
    orangeHeading('08 /', 'Mission Statement'),
    rule(ORANGE),
    instruction('As a group, write one mission statement. Use the three-part formula below. This is how you pitch your vision to the people who need to act on it.'),
    spacer(120),
    formulaBox,
    spacer(160),
    ...msLine('Guided by', 1),
    ...msLine('We will', 1),
    ...msLine('By', 1),
    spacer(160),
    fullBox,
    pageBreak(),
  ];
}

function buildClosingPage() {
  return [
    spacer(400),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'What Happens Next', font: FONT, size: 48, bold: true, color: BLACK })]
    }),
    rule(ORANGE, 240),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'A mission statement only works when it changes what people do. Share it. Test it. Return to it when pressure rises.', font: FONT, size: 24, color: BLACK })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'Your handout is a personal record of this experience. Keep it somewhere visible. Review your Edge Values and your commitment regularly.', font: FONT, size: 24, color: BLACK })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 400 },
      children: [new TextRun({ text: 'If the vision shifts, that is fine. What matters is that you keep returning to the question: are my values visible in what I do?', font: FONT, size: 24, color: BLACK })]
    }),
    rule(ORANGE),
    new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [new TextRun({ text: 'VISIONING  ·  University of Plymouth  ·  NAVIGATE Leadership Programme', font: FONT, size: 22, bold: true, color: ORANGE })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: 'Developed by Dr. Jonathan Rhodes and Prof. Jackie Andrade', font: FONT, size: 19, color: '888888', italics: true })]
    }),
  ];
}

// ─── HEADER / FOOTER ──────────────────────────────────────────────────────────

const docHeader = new Header({
  children: [
    new Paragraph({
      spacing: { before: 0, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } },
      children: [
        new TextRun({ text: 'VISIONING  ', font: FONT, size: 17, bold: true, color: ORANGE }),
        new TextRun({ text: 'Leadership Handout  ·  University of Plymouth NAVIGATE Leadership Programme', font: FONT, size: 17, color: '888888' }),
      ]
    })
  ]
});

const docFooter = new Footer({
  children: [
    new Paragraph({
      spacing: { before: 0, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREY_RULE } },
      children: [
        new TextRun({ text: 'Developed by Dr. Jonathan Rhodes and Prof. Jackie Andrade  ·  University of Plymouth NAVIGATE Leadership Programme          ', font: FONT, size: 15, color: 'AAAAAA' }),
        new TextRun({ text: 'Page ', font: FONT, size: 15, color: 'AAAAAA' }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: 'AAAAAA' }),
      ]
    })
  ]
});

// ─── ASSEMBLE DOC ─────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: { default: docHeader },
    footers: { default: docFooter },
    children: [
      ...buildCoverPage(),
      ...buildSection1(),
      ...buildSection2(),
      ...buildSection3(),
      ...buildSection4(),
      ...buildSection5(),
      ...buildSection6(),
      ...buildSection7(),
      ...buildSection8(),
      ...buildClosingPage(),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/Users/jrhodes/Desktop/Visioning/Visioning_Handout.docx', buf);
  console.log('Handout written successfully.');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
