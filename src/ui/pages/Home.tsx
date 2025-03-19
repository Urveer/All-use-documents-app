import { Link } from "react-router-dom";
import '../assets/Home.css';

export function Home() {
    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Welcome</h1>
                <p>Select a document type below:</p>
            </header>

            <ul className="buttons-list">
                {[1,2,3,4,5,6, 7].map((doc, index) => (
                    <li key={index}>
                        <Link to={`/doc-type-${doc}`}>
                            <button className="home-page-button">Document {doc}</button>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
