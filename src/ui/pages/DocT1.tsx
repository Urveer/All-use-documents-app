import { useState } from "react";
import * as XLSX from "xlsx";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import "../assets/DocT1.css";

interface Student {
    name: string;
    father_name: string;
    mother_name: string;
    dob: string;
    dob_chars: string[];
    aadhar_no: string;
    aadhar_chars: string[];
    sport: string;
    passport_no?: string;
    address: string;
    phone_no: string;
    admission_no: string;
    admission_year: string;
    dojs: string;
    name_of_insurer: string;
    policy_number: string;
    policy_value: string;
    policy_date_valid: string;
    current_grade: string;
    age_group: string;
}

export function DocT1() {
    const [students, setStudents] = useState<Student[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [processed, setProcessed] = useState<boolean>(false);
    const [schoolInfo, setSchoolInfo] = useState({
        school_naame: "",
        school_code: "",
        school_number: "",
        region: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSchoolInfo({ ...schoolInfo, [e.target.name]: e.target.value });
    };

    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExcelFile(event.target.files?.[0] || null);
    };

    const handleProcessExcel = () => {
        if (!excelFile) {
            setError("Please upload an Excel file.");
            return;
        }
        setProcessed(true)
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawJsonData = XLSX.utils.sheet_to_json(sheet);

                const formattedData: Student[] = rawJsonData.map((item: any) => ({
                    name: item["Name"],
                    father_name: item["Father Name"],
                    mother_name: item["Mother Name"],
                    dob: XLSX.SSF.format("dd/mm/yyyy", item["Date of Birth (DD/MM/YYYY)"]),
                    dob_chars: XLSX.SSF.format("dd/mm/yyyy", item["Date of Birth (DD/MM/YYYY)"]).replace(/\//g, "").split(""),
                    aadhar_no: item["Aadhar Number"].toString().replace(/\s/g, ""),
                    aadhar_chars: item["Aadhar Number"].toString().replace(/\s/g, "").split(""),
                    sport: item["Sport"],
                    passport_no: item["Passport Number"] || "",
                    address: item["Address"],
                    phone_no: item["Phone Number"].toString(),
                    admission_no: item["Admisson Number"].toString(),
                    admission_year: item["Admission Year"].toString(),
                    dojs: XLSX.SSF.format("dd/mm/yyyy", item["Date of Joining School"]),
                    name_of_insurer: item["Name of Insurer"],
                    policy_number: item["Policy Number"].toString(),
                    policy_value: item["Policy Value"].toString(),
                    policy_date_valid: item["Policy Valid Till"].toString(),
                    current_grade: item["Current Grade"].toString(),
                    age_group: item["Age Group"]
                }));

                setStudents(formattedData);
                setError(null); // Clear errors on success
            } catch (err) {
                setError("Error processing Excel file. Please check the format.");
            }
        };
        reader.readAsArrayBuffer(excelFile);
    };

    async function fetchWordTemplate(url: string): Promise<Uint8Array | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch template");
            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        } catch (error) {
            console.error("Error fetching Word template:", error);
            return null;
        }
    }

    async function generateWordDocs(students: Student[], schoolInfo: any) {
        const templateUrl = "/form-doc-t1.docx";
        const templateContent = await fetchWordTemplate(templateUrl);
        if (!templateContent) return;

        try {
            const templateZip = new PizZip(templateContent);
            const outputZip = new PizZip();

            students.forEach((student) => {
                let docXml = templateZip.files["word/document.xml"].asText();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(docXml, "application/xml");

                const replacePlaceholderInRuns = (xml: Document, placeholders: Record<string, string>) => {
                    Array.from(xml.getElementsByTagName("w:t")).forEach((textNode) => {
                        Object.entries(placeholders).forEach(([key, value]) => {
                            if (textNode.textContent?.includes(key)) {
                                textNode.textContent = textNode.textContent.replace(key, value);
                            }
                        });
                    });
                };

                const placeholders = {
                    name: student.name,
                    father_name: student.father_name,
                    mother_name: student.mother_name,
                    dob: student.dob,
                    aadhar_no: student.aadhar_no,
                    sport: student.sport,
                    passport_no: student.passport_no || "N/A",
                    address: student.address,
                    phone_no: student.phone_no,
                    admission_no: student.admission_no,
                    admission_year: student.admission_year,
                    dojs: student.dojs,
                    name_of_insurer: student.name_of_insurer,
                    policy_number: student.policy_number,
                    policy_value: student.policy_value,
                    policy_date_valid: student.policy_date_valid,
                    current_grade: student.current_grade,
                    prev_grade: (Number(student.current_grade) - 1).toString(),
                    age_group: student.age_group,
                    school_name: schoolInfo.school_naame,
                    school_code: schoolInfo.school_code,
                    school_number: schoolInfo.school_number,
                    region: schoolInfo.region
                };

                replacePlaceholderInRuns(xmlDoc, placeholders);
                student.dob_chars.forEach((char, index) => replacePlaceholderInRuns(xmlDoc, { [`d_${index}`]: char || "" }));
                student.aadhar_chars.forEach((char, index) => replacePlaceholderInRuns(xmlDoc, { [`a_${index}`]: char || "" }));

                const serializer = new XMLSerializer();
                docXml = serializer.serializeToString(xmlDoc);
                const studentZip = new PizZip(templateContent);
                studentZip.file("word/document.xml", docXml);

                const studentArrayBuffer = studentZip.generate({ type: "uint8array" });
                outputZip.file(`${student.name}_eligibility_form.docx`, studentArrayBuffer);
            });

            const zipUint8Array = outputZip.generate({ type: "uint8array" });
            const zipBlob = new Blob([zipUint8Array], { type: "application/zip" });
            saveAs(zipBlob, "Student_Documents.zip");
        } catch (err) {
            console.error("Error processing Word template:", err);
        }
    }

    return (
        <div className="container">
            <h2>Upload Files</h2>

            <label className="file-label">
                Upload Excel File
                <div className="file-input">
                    <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                </div>
            </label>

            {/* <label className="file-label">
                Upload Word Template
                <div className="file-input">
                    <input type="file" accept=".docx" onChange={handleWordUpload} />
                </div>
            </label> */}

            <div className="input-container">
                <input
                    className="input-field"
                    type="text"
                    name="school_naame"
                    placeholder="School Name"
                    onChange={handleInputChange}
                />
                <input
                    className="input-field"
                    type="text"
                    name="school_code"
                    placeholder="School Code"
                    onChange={handleInputChange}
                />
                <input
                    className="input-field"
                    type="text"
                    name="school_number"
                    placeholder="School Number"
                    onChange={handleInputChange}
                />
                <input
                    className="input-field"
                    type="text"
                    name="region"
                    placeholder="Zone/Region"
                    onChange={handleInputChange}
                />
            </div>

            <button className="submit-button" onClick={handleProcessExcel}>
                Submit and Process Files
            </button>

            {error && <p className="error">{error}</p>}

            <ul className="students-list">
                {students.map((student, index) => (
                    <li className="student-card" key={index}>
                        <div className="top">
                            <p className="name">{student.name}</p>
                        </div>
                        <div className="bottom">
                            <p className="name">Admission Number: {student.admission_no}</p>
                            <p className="name">Class: {student.current_grade}</p>
                            <p className="name">Sport: {student.sport}</p>
                        </div>
                    </li>
                ))}
            </ul>
            {processed && <button onClick={() => { generateWordDocs(students, schoolInfo) }}>Download Word</button>}
        </div>
    );
}