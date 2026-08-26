import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PaperContentModel, RenderedSectionItem } from "./paperModel";
import { MCQ_LIKE_TYPES } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { paddingHorizontal: 42, paddingVertical: 36, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 15, fontWeight: 700, textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 11, textAlign: "center", marginBottom: 12, color: "#444" },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: "row", marginBottom: 6 },
  qNumber: { width: 30, fontSize: 10, fontWeight: 700 },
  qBody: { flex: 1 },
  answerLine: { fontSize: 10, marginBottom: 2 },
  markingLine: { fontSize: 9, color: "#444", marginLeft: 8 },
});

function answerSummary(item: RenderedSectionItem) {
  const q = item.question;
  if (MCQ_LIKE_TYPES.includes(q.type as (typeof MCQ_LIKE_TYPES)[number])) {
    const correct = q.options.find((o) => o.isCorrect);
    return correct ? `${correct.label}. ${correct.text}` : "(answer not set)";
  }
  if (q.type === "TRUE_FALSE" || q.type === "FILL_BLANK" || q.type === "VERY_SHORT_ANSWER" || q.type === "QUESTION_ANSWER") {
    return q.answerText ?? "(answer not set)";
  }
  if (q.type === "MATCH_FOLLOWING") {
    return q.options.map((o, i) => `${i + 1}-${o.matchText}`).join(", ");
  }
  return q.answerText ?? "(see key points below)";
}

export function AnswerKeyDocument({ paper }: { paper: PaperContentModel }) {
  return (
    <Document title={`${paper.title} - Answer Key`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{paper.title} — Answer Key</Text>
        <Text style={styles.subtitle}>
          {paper.totalQuestions} questions — {paper.totalMarks} marks total
        </Text>

        {paper.sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item.question.id} style={styles.row} wrap={false}>
                <Text style={styles.qNumber}>Q{item.number}.</Text>
                <View style={styles.qBody}>
                  <Text style={styles.answerLine}>{answerSummary(item)}</Text>
                  {item.question.explanation ? (
                    <Text style={styles.markingLine}>Explanation: {item.question.explanation}</Text>
                  ) : null}
                  {Array.isArray(item.question.markingScheme) && item.question.markingScheme.length > 0
                    ? (item.question.markingScheme as { criterion: string; marks: number }[]).map((m, i) => (
                        <Text key={i} style={styles.markingLine}>
                          • {m.criterion} — {m.marks} mark(s)
                        </Text>
                      ))
                    : null}
                </View>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
