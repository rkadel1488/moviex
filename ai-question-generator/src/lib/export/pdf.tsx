import { renderToBuffer } from "@react-pdf/renderer";
import { PaperDocument } from "./PaperDocument";
import { AnswerKeyDocument } from "./AnswerKeyDocument";
import type { PaperContentModel } from "./paperModel";

export async function renderPaperPdf(paper: PaperContentModel): Promise<Buffer> {
  return renderToBuffer(<PaperDocument paper={paper} />);
}

export async function renderAnswerKeyPdf(paper: PaperContentModel): Promise<Buffer> {
  return renderToBuffer(<AnswerKeyDocument paper={paper} />);
}
