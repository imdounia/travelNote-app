import React, { useState, useEffect } from 'react';
import './App.css';
import '@aws-amplify/ui-react/styles.css';
import {Amplify, API, Storage } from 'aws-amplify';
import { withAuthenticator, Button, Heading } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
import { v4 as uuid } from 'uuid';
Amplify.configure(awsExports);

function App({ signOut, user }) {
  const [notes, setNotes] = useState([]);
  const [place, setPlace] = useState('');
  const [comment, setComment] = useState('');
  const [rate, setRate] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageKeys, setImageKeys] = useState([]); 

  useEffect(() => {
    fetchImages(); // Chargez la liste des images au montage initial
    fetchNotes(); // Chargez les notes au montage initial
  }, []);

  const fetchNotes = async () => {
    try {
      const notesData = await API.get('apiamplify', '/placeComments');
      setNotes(notesData);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUploadImage = async () => {
    if (selectedFile) {
      const imageKey = `images/${uuid()}-${selectedFile.name}`;
      try {
        await Storage.put(imageKey, selectedFile, {
          level: 'private',
          contentType: selectedFile.type,
        });

        setSelectedFile(null);
        // Rafraîchissez la liste des images après l'upload
        fetchImages();
      } catch (error) {
        console.error('Erreur lors du téléversement de l\'image:', error);
      }
    }
  };

  const fetchImages = async () => {
    try {
      // Obtenez la liste des clés d'images depuis S3
      const imageKeysData = await Storage.list('images/', { level: 'private' });
      const imageKeys = imageKeysData.results.map(imageKeyData => imageKeyData.key);
      console.log(imageKeys);
      // Mettez à jour l'état des images
      setImageKeys(imageKeys);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
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
      <div className="header">
        <div className="user-info">
          <p>Hello {user.attributes.email}</p>
        </div>
        <Button onClick={signOut}>Sign out</Button>
      </div>
      <Heading level={1}>my travel notes</Heading>
      <div className="sections">
        <div className="left-section">
          <div className="input-section">
            <input type="file" onChange={handleFileUpload} />
            <Button onClick={handleUploadImage}>Uploader l'image</Button>
          </div>
          <div className="image-section">
            {imageKeys.map((imageKey) => (
              <div key={imageKey}>
                <p>Image name : {imageKey}</p>
                <img src={Storage.get(imageKey)} alt={imageKey} />
              </div>
            ))}
          </div>
        </div>
        <div className="right-section">
          <div className="form-section">
          <p>Place :</p>
            <input
              type="text"
              placeholder="Place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
            <br/>
            <p>Comment :</p>
            <textarea
              placeholder="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <br/>
            <p>Rate :</p>
            <input
              type="number"
              placeholder="Rate (0-5)"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              min="0"
              max="5"
            /><br/>
            <Button onClick={handleAddNote}>Ajouter une note</Button>
          </div>
          <div className="notes-list">
            {notes.map((note) => (
              <div key={note.id} className="note-item">
                <h3>{note.place}</h3>
                <p>{note.comment}</p>
                <p>
                  Note: {note.rate}{' '}
                  {Array.from({ length: note.rate }).map((_, index) => (
                    <span key={index}>⭐</span>
                  ))}
                </p>
                {note.imageKey && (
                  <div>
                    <img src={Storage.get(note.imageKey)} alt={`${note.place}`} />
                    <p>Nom de l'image : {note.imageKey}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuthenticator(App);
