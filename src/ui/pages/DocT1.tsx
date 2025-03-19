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
    const [wordTemplate, setWordTemplate] = useState<File | null>(null);
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

    const handleWordUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setWordTemplate(event.target.files?.[0] || null);
    };

    const generateWordDocs = (students: Student[]) => {
        if (!wordTemplate) {
            setError("Please upload a Word template first.");
            return;
        }
    
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const templateContent = new Uint8Array(e.target?.result as ArrayBuffer);
                const templateZip = new PizZip(templateContent);
                const outputZip = new PizZip();
    
                students.forEach((student) => {
                    let docXml = templateZip.files["word/document.xml"].asText();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(docXml, "application/xml");
    
                    // Function to replace placeholders dynamically
                    const replacePlaceholderInRuns = (xml: Document, placeholders: Record<string, string>) => {
                        Array.from(xml.getElementsByTagName("w:t")).forEach((textNode) => {
                            Object.entries(placeholders).forEach(([key, value]) => {
                                if (textNode.textContent?.includes(key)) {
                                    textNode.textContent = textNode.textContent.replace(key, value);
                                }
                            });
                        });
                    };
    
                    // Define placeholders
                    const placeholders = {
                        name: student.name,
                        father_naame: student.father_name,
                        mother_naame: student.mother_name,
                        dob: student.dob,
                        aadhar_no: student.aadhar_no,
                        sport: student.sport,
                        passport_no: student.passport_no || "N/A",
                        address: student.address,
                        phone_no: student.phone_no,
                        admission_no: student.admission_no,
                        admission_year: student.admission_year,
                        dojs: student.dojs,
                        naame_of_insurer: student.name_of_insurer,
                        policy_number: student.policy_number,
                        policy_value: student.policy_value,
                        policy_date_valid: student.policy_date_valid,
                        current_grade: student.current_grade,
                        prev_grade: (Number(student.current_grade) - 1).toString(),
                        age_group: student.age_group,
                        school_naame: schoolInfo.school_naame,
                        school_code: schoolInfo.school_code,
                        school_number: schoolInfo.school_number,
                        region: schoolInfo.region
                    };
    
                    // Replace placeholders
                    replacePlaceholderInRuns(xmlDoc, placeholders);
    
                    // Handle dob_chars & aadhar_chars separately
                    student.dob_chars.forEach((char, index) => {
                        replacePlaceholderInRuns(xmlDoc, { [`d_${index}`]: char || "" });
                    });
                    student.aadhar_chars.forEach((char, index) => {
                        replacePlaceholderInRuns(xmlDoc, { [`a_${index}`]: char || "" });
                    });
    
                    // Serialize modified document XML
                    const serializer = new XMLSerializer();
                    docXml = serializer.serializeToString(xmlDoc);
                    
                    // Create new document zip for student
                    const studentZip = new PizZip(templateContent);
                    studentZip.file("word/document.xml", docXml);
    
                    // Generate final Word file for the student as ArrayBuffer
                    const studentArrayBuffer = studentZip.generate({ type: "uint8array" });
    
                    // Add document to output ZIP as Uint8Array (NOT Blob)
                    outputZip.file(`${student.name}_eligibility_form.docx`, studentArrayBuffer);
                });
    
                // Generate the ZIP file as Uint8Array (correct format for PizZip)
                const zipUint8Array = outputZip.generate({ type: "uint8array" });
    
                // Convert Uint8Array to Blob before saving
                const zipBlob = new Blob([zipUint8Array], { type: "application/zip" });
    
                // Save ZIP file
                saveAs(zipBlob, "Student_Documents.zip");
                setError(null); // Clear errors on success
    
            } catch (err) {
                setError("Error processing Word template. Ensure placeholders are correct.");
            }
        };
    
        reader.readAsArrayBuffer(wordTemplate);
    };
    


    return (
        <div className="container">
            <h2>Upload Files</h2>

            <label className="file-label">
                Upload Excel File
                <input type="file" accept=".xlsx, .xls" className="file-input" onChange={handleExcelUpload} />
            </label>

            <label className="file-label">
                Upload Word Template
                <input type="file" accept=".docx" className="file-input" onChange={handleWordUpload} />
            </label>

            <button className="small-button" onClick={handleProcessExcel}>Process Excel</button>

            {/* ✅ Side-by-Side Inputs */}
            <div className="input-container">
                <input className="input-field" type="text" name="school_naame" placeholder="School Name" onChange={handleInputChange} />
                <input className="input-field" type="text" name="school_code" placeholder="School Code" onChange={handleInputChange} />
                <input className="input-field" type="text" name="school_number" placeholder="School Number" onChange={handleInputChange} />
                <input className="input-field" type="text" name="region" placeholder="Zone/Region" onChange={handleInputChange} />
            </div>

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
            {processed && <button onClick={() => { generateWordDocs(students) }}>Download Word</button>}
        </div>
    );
}