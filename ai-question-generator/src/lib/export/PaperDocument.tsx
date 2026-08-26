import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PaperContentModel, RenderedSectionItem } from "./paperModel";
import { questionTypeLabel } from "./paperModel";

const styles = StyleSheet.create({
  page: { paddingHorizontal: 42, paddingVertical: 36, fontSize: 11, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  schoolName: { fontSize: 16, fontWeight: 700, textAlign: "center" },
  examName: { fontSize: 13, textAlign: "center", marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 4 },
  metaText: { fontSize: 10 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#000", marginVertical: 6 },
  instructionsBox: { marginBottom: 10 },
  instructionsTitle: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  instructionLine: { fontSize: 10, marginBottom: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 2, textAlign: "center" },
  sectionMeta: { fontSize: 9, textAlign: "center", marginBottom: 6, color: "#444" },
  sectionInstructions: { fontSize: 10, fontStyle: "italic", marginBottom: 6 },
  questionRow: { flexDirection: "row", marginBottom: 8 },
  qNumber: { width: 24, fontSize: 11 },
  qBody: { flex: 1 },
  qText: { fontSize: 11, marginBottom: 3 },
  qMarks: { fontSize: 9, color: "#444" },
  caseContext: { fontSize: 10, marginBottom: 4, padding: 6, backgroundColor: "#f2f2f2" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  option: { fontSize: 10, marginRight: 14, marginBottom: 2 },
  matchColumns: { flexDirection: "row", marginTop: 4 },
  matchColumn: { flex: 1, paddingRight: 8 },
  matchHeading: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  wordBank: { fontSize: 9, fontStyle: "italic", marginTop: 3 },
});

function QuestionBody({ item }: { item: RenderedSectionItem }) {
  const q = item.question;
  return (
    <View style={styles.qBody}>
      {q.caseContext ? <Text style={styles.caseContext}>{q.caseContext}</Text> : null}
      <Text style={styles.qText}>
        {q.questionText} {item.isOptional ? "(Optional)" : ""}
      </Text>
      {q.type === "MATCH_FOLLOWING" ? (
        <View style={styles.matchColumns}>
          <View style={styles.matchColumn}>
            <Text style={styles.matchHeading}>Column A</Text>
            {q.options.map((o, i) => (
              <Text key={o.id} style={styles.option}>
                {i + 1}. {o.text}
              </Text>
            ))}
          </View>
          <View style={styles.matchColumn}>
            <Text style={styles.matchHeading}>Column B</Text>
            {q.options.map((o, i) => (
              <Text key={o.id} style={styles.option}>
                {String.fromCharCode(97 + i)}. {o.matchText}
              </Text>
            ))}
          </View>
        </View>
      ) : q.options.length > 0 ? (
        <View style={styles.optionRow}>
          {q.options.map((o) => (
            <Text key={o.id} style={styles.option}>
              {o.label}. {o.text}
            </Text>
          ))}
        </View>
      ) : null}
      {q.wordBank ? <Text style={styles.wordBank}>Word bank: {(q.wordBank as string[]).join(", ")}</Text> : null}
    </View>
  );
}

export function PaperDocument({ paper }: { paper: PaperContentModel }) {
  const { meta } = paper;
  return (
    <Document title={paper.title}>
      <Page size="A4" style={styles.page}>
        {meta.schoolName ? <Text style={styles.schoolName}>{meta.schoolName}</Text> : null}
        {meta.examName || paper.title ? <Text style={styles.examName}>{meta.examName || paper.title}</Text> : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Subject: {meta.subject ?? ""}</Text>
          <Text style={styles.metaText}>Grade: {meta.grade ?? ""}</Text>
          <Text style={styles.metaText}>Date: {meta.date ?? ""}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Time: {meta.time ?? ""}</Text>
          <Text style={styles.metaText}>Full Marks: {meta.fullMarks ?? paper.totalMarks}</Text>
          <Text style={styles.metaText}>Pass Marks: {meta.passMarks ?? ""}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Student Name: ______________________</Text>
          <Text style={styles.metaText}>Roll No: __________</Text>
        </View>

        <View style={styles.hr} />

        {meta.instructions && meta.instructions.length > 0 ? (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>General Instructions</Text>
            {meta.instructions.map((line, i) => (
              <Text key={i} style={styles.instructionLine}>
                {i + 1}. {line}
              </Text>
            ))}
          </View>
        ) : null}

        {paper.sections.map((section) => (
          <View key={section.title} wrap>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.items.length} x question(s) — {section.marks} marks
            </Text>
            {section.instructions ? <Text style={styles.sectionInstructions}>{section.instructions}</Text> : null}
            {section.items.map((item) => (
              <View key={item.question.id} style={styles.questionRow} wrap={false}>
                <Text style={styles.qNumber}>Q{item.number}.</Text>
                <QuestionBody item={item} />
                <Text style={styles.qMarks}>[{item.marks}]</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function typeLabelForDisplay(type: string) {
  return questionTypeLabel(type);
}
