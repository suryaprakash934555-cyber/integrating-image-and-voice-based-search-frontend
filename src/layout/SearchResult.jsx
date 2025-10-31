import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import Header from './Header';
import { useCart } from '../context/CartContext';
import './style.css';

function SearchResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, toggleCart } = useCart();
  const { results, query, searchType } = location.state || {};

  if (!results) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          No search results found. Please try a different search.
        </Alert>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </Container>
    );
  }

  const products = results.products || results.results || [];

  const calculateDiscount = (price, mrp) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const handleAddToCart = (product, event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
    
    // Optional: Show a quick confirmation
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check me-2"></i>Added!';
    button.disabled = true;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
  };

  const handleBuyNow = (product, event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(product);
    toggleCart(); // Open cart immediately
  };

  return (
    <>
      <Header />
      <Container className="my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="search-title">
            Search Results for "{query}"
            {searchType === 'image' && (
              <Badge bg="info" className="ms-2">Image Search</Badge>
            )}
          </h2>
          <div>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/')}
              className="me-2"
            >
              New Search
            </Button>
            <Button 
              variant="primary" 
              onClick={toggleCart}
              className="cart-toggle-btn"
            >
              <i className="fas fa-shopping-cart me-2"></i>
              View Cart
            </Button>
          </div>
        </div>
        
        {products.length === 0 ? (
          <Alert variant="info" className="text-center">
            <i className="fas fa-search me-2"></i>
            No products found matching your search criteria.
          </Alert>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="text-muted mb-0">
                Found <strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <Row>
              {products.map((product) => {
                const discount = calculateDiscount(product.price, product.mrp);
                
                return (
                  <Col key={product.id} xl={3} lg={4} md={6} className="mb-4">
                    <Card className="h-100 product-card shadow-sm">
                      <div className="card-image-container">
                        <Card.Img 
                          variant="top" 
                          src={product.image_url} 
                          className="product-image"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        {discount > 0 && (
                          <Badge bg="danger" className="discount-badge">
                            -{discount}%
                          </Badge>
                        )}
                      </div>
                      
                      <Card.Body className="d-flex flex-column p-3">
                        <div className="product-category mb-1">
                          <small className="text-muted text-uppercase">
                            {product.category || product.style}
                          </small>
                        </div>
                        
                        <Card.Title className="h6 product-title mb-2">
                          {product.name.length > 50 
                            ? `${product.name.substring(0, 50)}...` 
                            : product.name
                          }
                        </Card.Title>
                        
                        <div className="mt-auto">
                          <div className="price-section mb-3">
                            <div className="d-flex align-items-center">
                              <span className="current-price fw-bold text-primary fs-5">
                                ${product.price}
                              </span>
                              {product.mrp && product.mrp > product.price && (
                                <>
                                  <span className="original-price text-muted text-decoration-line-through ms-2">
                                    ${product.mrp}
                                  </span>
                                  {discount > 0 && (
                                    <small className="discount-text text-success fw-bold ms-2">
                                      Save ${(product.mrp - product.price).toFixed(2)}
                                    </small>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="d-grid gap-2">
                            <Button 
                              variant="primary" 
                              size="sm"
                              className="add-to-cart-btn"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              <i className="fas fa-cart-plus me-2"></i>
                              Add to Cart
                            </Button>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="w-100 mt-2"
                              onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              className="buy-now-btn"
                              onClick={(e) => handleBuyNow(product, e)}
                            >
                              <i className="fas fa-bolt me-2"></i>
                              Buy Now
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </Container>
    </>
  );
}

export default SearchResult;