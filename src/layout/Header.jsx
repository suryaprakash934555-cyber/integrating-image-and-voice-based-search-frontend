import React, { useState, useRef } from 'react';
import { Navbar, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Menu from './Menu';
import Button from '../components/Button';
import './style.css';
import logo from '../assets/logo.png';

function Header() {
  const [query, setQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcriptionService, setTranscriptionService] = useState('deepgram');
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const ASSEMBLYAI_API_KEY = process.env.REACT_APP_ASSEMBLYAI_API_KEY || '73b00662e49c4aa2bb270a3ec8705540';
  const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY || '3020147ef806846932ecf29b63e07c1671a144e6';

  // Enhanced search query processor
  // Enhanced search query processor - Update this function in your Header component
const processSearchQuery = (searchQuery) => {
  if (!searchQuery) return { style: '', category: '', priceRange: null, color: '' };

  const query = searchQuery.toLowerCase().trim();
  
  // Define search patterns
  const patterns = {
    // Price ranges
    priceUnder500: /(under|below|less than|upto|under)\s*(\d+)/i,
    priceRange: /(\d+)\s*-\s*(\d+)/i,
    priceAbove: /(above|over|more than)\s*(\d+)/i,
    
    // Categories - improved matching
    categories: {
      shirt: /\b(shirt|shirts|top|tops|t-shirt|tshirt)\b/,
      pant: /\b(pant|pants|trouser|trousers|jeans|jean)\b/,
      shoe: /\b(shoe|shoes|footwear|sneaker|sneakers)\b/,
      belt: /\b(belt|belts)\b/,
      dress: /\b(dress|dresses|gown|gowns)\b/,
      clothing: /\b(cloth|clothes|clothing|apparel|wear)\b/
    },
    
    // Styles
    styles: {
      formal: /\b(formal|office|business|corporate)\b/,
      casual: /\b(casual|everyday|regular|comfort)\b/,
      party: /\b(party|night|celebration|festive|evening)\b/,
      sports: /\b(sports|sport|active|athletic|gym)\b/,
      traditional: /\b(traditional|ethnic|cultural|indian)\b/
    },
    
    // Colors
    colors: {
      red: /\b(red|scarlet|crimson|maroon)\b/,
      blue: /\b(blue|navy|sky|azure)\b/,
      black: /\b(black|ebony|charcoal)\b/,
      white: /\b(white|ivory|cream)\b/,
      green: /\b(green|emerald|olive)\b/,
      yellow: /\b(yellow|gold|mustard)\b/,
      pink: /\b(pink|rose|fuchsia)\b/,
      purple: /\b(purple|violet|lavender)\b/,
      brown: /\b(brown|tan|beige)\b/,
      gray: /\b(gray|grey|silver)\b/
    }
  };

  const result = {
    style: '',
    category: '',
    priceRange: null,
    color: '',
    originalQuery: query
  };

  // Extract price information
  const underMatch = query.match(patterns.priceUnder500);
  const rangeMatch = query.match(patterns.priceRange);
  const aboveMatch = query.match(patterns.priceAbove);

  if (underMatch) {
    const maxPrice = parseInt(underMatch[2]) || 500;
    result.priceRange = { min: 0, max: maxPrice };
  } else if (rangeMatch) {
    const minPrice = parseInt(rangeMatch[1]);
    const maxPrice = parseInt(rangeMatch[2]);
    result.priceRange = { min: minPrice, max: maxPrice };
  } else if (aboveMatch) {
    const minPrice = parseInt(aboveMatch[2]) || 500;
    result.priceRange = { min: minPrice, max: 10000 };
  }

  // Extract categories - check all categories
  for (const [category, pattern] of Object.entries(patterns.categories)) {
    if (pattern.test(query)) {
      result.category = category;
      break;
    }
  }

  // Extract styles
  for (const [style, pattern] of Object.entries(patterns.styles)) {
    if (pattern.test(query)) {
      result.style = style;
      break;
    }
  }

  // Extract colors
  for (const [color, pattern] of Object.entries(patterns.colors)) {
    if (pattern.test(query)) {
      result.color = color;
      break;
    }
  }

  console.log('Processed search query:', result);
  return result;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Process the natural language query
      const processedQuery = processSearchQuery(query);
      
      // Build API URL with processed parameters
      const params = new URLSearchParams();
      
      if (processedQuery.style) {
        params.append('style', processedQuery.style);
      }
      
      if (processedQuery.category) {
        params.append('category', processedQuery.category);
      }
      
      if (processedQuery.color) {
        params.append('color', processedQuery.color);
      }
      
      if (processedQuery.priceRange) {
        params.append('min_price', processedQuery.priceRange.min);
        params.append('max_price', processedQuery.priceRange.max);
      }
      
      // If no specific parameters, use the original query for general search
      if (params.toString() === '') {
        params.append('search', query);
      }

      const url = `${API_BASE_URL}/smart-search?${params.toString()}`;
      console.log('Search URL:', url);

      const response = await fetch(url, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data);
      
      // Navigate to search results page
      navigate('/search-results', { 
        state: { 
          results: data, 
          query: query,
          processedQuery: processedQuery
        } 
      });
      
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // AssemblyAI Transcription
  const transcribeWithAssemblyAI = async (audioBlob) => {
    try {
      if (!ASSEMBLYAI_API_KEY) {
        throw new Error('AssemblyAI API key is missing.');
      }

      console.log('Uploading audio to AssemblyAI...');
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
        },
        body: audioBlob
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.upload_url;

      console.log('Starting transcription...');
      const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_detection: true
        })
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        throw new Error(`Transcription request failed: ${transcriptionResponse.status} - ${errorText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcriptId = transcriptionData.id;

      // Poll for transcription result
      let transcribedText = '';
      let attempts = 0;
      const maxAttempts = 30;

      console.log('Polling for transcription result...');
      while (attempts < maxAttempts) {
        const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
          }
        });

        if (!resultResponse.ok) {
          throw new Error(`Transcript fetch failed: ${resultResponse.status}`);
        }

        const resultData = await resultResponse.json();
        
        if (resultData.status === 'completed') {
          transcribedText = resultData.text;
          console.log('AssemblyAI transcription completed:', transcribedText);
          break;
        } else if (resultData.status === 'error') {
          throw new Error(`Transcription failed: ${resultData.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Transcription timeout');
      }

      return transcribedText;

    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      throw error;
    }
  };

  // Deepgram Transcription
  const transcribeWithDeepgram = async (audioBlob) => {
    try {
      if (!DEEPGRAM_API_KEY) {
        throw new Error('Deepgram API key is missing.');
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      
      console.log('Sending audio to Deepgram...');
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm',
        },
        body: arrayBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.channels && data.results.channels.length > 0) {
        const transcript = data.results.channels[0].alternatives[0].transcript;
        console.log('Deepgram transcription completed:', transcript);
        return transcript;
      } else {
        throw new Error('No transcription results from Deepgram');
      }
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw error;
    }
  };

  const startVoiceRecording = async () => {
    if (transcriptionService === 'assemblyai' && !ASSEMBLYAI_API_KEY) {
      setError('AssemblyAI API key is not configured.');
      return;
    }
    
    if (transcriptionService === 'deepgram' && !DEEPGRAM_API_KEY) {
      setError('Deepgram API key is not configured.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      mediaRecorderRef.current = mediaRecorder;
      
      let audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processVoiceSearch(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setError(null);
      
      let timeLeft = 10;
      setRecordingTime(timeLeft);
      
      recordingIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setRecordingTime(timeLeft);
        
        if (timeLeft <= 0) {
          stopVoiceRecording();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const processVoiceSearch = async (audioBlob) => {
    setLoading(true);
    setError(null);
    setTranscriptionResult(null);

    try {
      let transcribedText = '';
      const startTime = Date.now();
      
      if (transcriptionService === 'assemblyai') {
        transcribedText = await transcribeWithAssemblyAI(audioBlob);
      } else if (transcriptionService === 'deepgram') {
        transcribedText = await transcribeWithDeepgram(audioBlob);
      }
      
      const processingTime = Date.now() - startTime;
      
      setTranscriptionResult({
        text: transcribedText,
        service: transcriptionService,
        processingTime: processingTime
      });

      if (transcribedText) {
        setQuery(transcribedText);
        
        if (transcribedText.trim().length > 0) {
          setTimeout(() => {
            handleSubmit(new Event('submit'));
          }, 500);
        }
      } else {
        setError('No speech detected. Please try again.');
      }
      
    } catch (error) {
      console.error('Voice search error:', error);
      setError(`Voice transcription failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTranscriptionService = () => {
    const newService = transcriptionService === 'assemblyai' ? 'deepgram' : 'assemblyai';
    setTranscriptionService(newService);
    setError(null);
    setTranscriptionResult(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB.');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    processImageSearch(file);
  };

  const processImageSearch = async (imageFile) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('k', '8');

      const response = await fetch(`${API_BASE_URL}/filter-products`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Image search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data);
        setQuery('Similar products');
        
        navigate('/search-results', { 
          state: { 
            results: data, 
            query: 'Similar products',
            searchType: 'image' 
          } 
        });
      } else {
        setError('No similar products found.');
      }
      
    } catch (error) {
      console.error('Image search error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerImageInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
    setError(null);
    setTranscriptionResult(null);
    clearImage();
  };

  // Add search suggestions
// Update the search suggestions array
const searchSuggestions = [
  "formal shirt under 500",
  "casual pants",
  "party shoes",
  "red dress",
  "black belt",
  "sports shoes",
  "traditional clothing",
  "blue jeans",
  "white t-shirt",
  "wedding dress",
  "office formal",
  "casual summer wear"
];

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      
      if (e.key === 'Escape') {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <header>
      <Navbar className="header" variant="dark" expand="lg">
        <div className="container d-flex justify-content-between align-items-center gap-5 w-100">
          <Navbar.Brand as={Link} to="/" className='brands gap-2 d-flex align-items-center'>
            <img src={logo} alt="logo" />
            <span className='fw-bold'>TRI-SHOP</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <div className="d-block d-lg-none w-100">
              <Menu color="white" />
            </div>

            <div className="d-flex align-items-center gap-3 w-100">
              {/* Search Form */}
              <form className="flex-grow-1 position-relative" onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-white text-black pe-5"
                    placeholder="Try: formal under 500, red shirt, party shoes..."
                    style={{ minWidth: '300px' }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    list="search-suggestions"
                  />
                  
                  {/* Search Suggestions */}
                  <datalist id="search-suggestions">
                    {searchSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion} />
                    ))}
                  </datalist>
                  
                  {loading && (
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  )}
                  
                  {query && !loading && (
                    <button 
                      type="button" 
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3"
                      onClick={clearSearch}
                      style={{ zIndex: 5 }}
                    >
                      <i className="bi bi-x text-muted"></i>
                    </button>
                  )}
                  
                  {imagePreview && (
                    <div className="position-absolute start-0 top-50 translate-middle-y ms-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          objectFit: 'cover', 
                          borderRadius: '4px' 
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Query Analysis Badge */}
                {query && (
                  <div className="position-absolute start-0 bottom-0 translate-middle-y mb-1 ms-2">
                    <Badge bg="info" className="small">
                      {(() => {
                        const processed = processSearchQuery(query);
                        const parts = [];
                        if (processed.style) parts.push(processed.style);
                        if (processed.category) parts.push(processed.category);
                        if (processed.color) parts.push(processed.color);
                        if (processed.priceRange) parts.push(`₹${processed.priceRange.min}-${processed.priceRange.max}`);
                        return parts.join(' • ') || 'general';
                      })()}
                    </Badge>
                  </div>
                )}
                
                <small className="text-white-50 position-absolute end-0 bottom-0 translate-middle-y mb-1 me-2">
                  Ctrl+K
                </small>
              </form>

              {/* Search Actions */}
              <div className="d-flex align-items-center gap-2">
                <button 
                  className={`btn ${transcriptionService === 'deepgram' ? 'btn-warning' : 'btn-info'} btn-sm`}
                  onClick={toggleTranscriptionService}
                  title={`Switch to ${transcriptionService === 'assemblyai' ? 'Deepgram' : 'AssemblyAI'}`}
                  disabled={loading || isRecording}
                >
                  <i className={`bi ${transcriptionService === 'assemblyai' ? 'bi-robot' : 'bi-magic'}`}></i>
                  <small className="ms-1">{transcriptionService === 'assemblyai' ? 'AAI' : 'DG'}</small>
                </button>

                <button 
                  className={`btn ${isRecording ? 'btn-danger' : 'btn-outline-light'} btn-sm`}
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  title={isRecording ? 'Stop recording' : `Voice search with ${transcriptionService}`}
                  disabled={loading}
                >
                  <i className={`bi ${isRecording ? 'bi-stop-fill' : 'bi-mic-fill'}`}></i>
                  {isRecording && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {recordingTime}
                    </span>
                  )}
                </button>
                
                <button 
                  className="btn btn-outline-light btn-sm"
                  onClick={triggerImageInput}
                  title="Search by image"
                  disabled={loading}
                >
                  <i className="bi bi-camera-fill"></i>
                </button>
                
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmit}
                  disabled={loading || !query.trim()}
                  title="Search products"
                >
                  <i className="bi bi-search"></i>
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              
              <Button buttonname="Login" fun="/login"/>
            </div>
          </Navbar.Collapse>
        </div>
      </Navbar>
      
      <div className="d-none d-lg-block w-100">
        <Menu color="#00416A" />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="container mt-2">
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <Alert.Heading>
              {transcriptionService === 'deepgram' ? 'Deepgram' : 'AssemblyAI'} Error
            </Alert.Heading>
            {error}
          </Alert>
        </div>
      )}

      {/* Recording Modal */}
      {isRecording && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Voice Search with {transcriptionService === 'deepgram' ? 'Deepgram' : 'AssemblyAI'}
                </h5>
                <button type="button" className="btn-close" onClick={stopVoiceRecording}></button>
              </div>
              <div className="modal-body text-center">
                <div className="mb-3">
                  <i className="bi bi-mic-fill text-danger fs-1"></i>
                </div>
                <h6>Listening...</h6>
                <p>Speak now. Recording will stop in {recordingTime} seconds</p>
                <div className="progress mb-3">
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated bg-danger" 
                    style={{ width: `${((10 - recordingTime) / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="alert alert-info small">
                  <i className="bi bi-info-circle"></i> Try saying: "formal shirt under 500" or "red party dress"
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={stopVoiceRecording}>
                  <i className="bi bi-stop-fill"></i> Stop Recording
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded p-4 text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">
              {transcriptionResult ? 'Searching products...' : `Processing with ${transcriptionService}...`}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;