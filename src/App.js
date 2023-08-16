import { Amplify, API, Storage } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
Amplify.configure(awsExports);

function App() {
  const [notes, setNotes] = useState([]);
  const [place, setPlace] = useState('');
  const [comment, setComment] = useState('');
  const [rate, setRate] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const notesData = await API.get('apiamplify', '/placeComments');
      setNotes(notesData);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUploadImage = async () => {
    if (selectedFile) {
      const imageKey = `${uuid()}-${selectedFile.name}`;
      try {
        await Storage.put(imageKey, selectedFile, {
          level: 'private',
          contentType: selectedFile.type,
        });
        
        setSelectedFile(null);
      } catch (error) {
        console.error('Erreur lors du téléversement de l\'image:', error);
      }
    }
  };

  const handleAddNote = async () => {
    if (place && comment) {
      const newNote = {
        id: uuid(),
        place,
        comment,
        rate,
      };

      try {
        await API.post('apiamplify', '/placeComments', { body: newNote });
        setNotes([...notes, newNote]);
        setPlace('');
        setComment('');
        setRate(0);
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la note:', error);
      }
    }
  };

  return (
    <div className="App">
      <h1>Mon Carnet de Voyage</h1>
      <div className="input-section">
        <input
          type="file"
          onChange={(e) => handleFileUpload(e)}
        />
        <button onClick={handleUploadImage}>Uploader l'image</button>
      </div>
      <div className="form-section">
        <input
          type="text"
          placeholder="Lieu"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <textarea
          placeholder="Commentaire"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <input
          type="number"
          placeholder="Note"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <button onClick={handleAddNote}>Ajouter une note</button>
      </div>
      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-item">
            <h3>{note.place}</h3>
            <p>{note.comment}</p>
            <p>
              Note: {note.rate} {Array.from({ length: note.rate }).map((_, index) => <span key={index}>⭐</span>)}
            </p>
            {note.imageKey && (
              <img src={Storage.get(note.imageKey)} alt={`${note.place}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App);
