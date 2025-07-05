import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Footer from '@/components/Footer'

describe('Proof of Concept - Footer Component', () => {
  it('renders footer content without any context', () => {
    render(<Footer />)
    
    // Test basic content rendering
    expect(screen.getByText('AltogetherAgile')).toBeInTheDocument()
    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    
    // Test links
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('href', '/events')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
  })

  it('displays copyright information', () => {
    render(<Footer />)
    
    expect(screen.getByText('© 2024 AltogetherAgile. All rights reserved.')).toBeInTheDocument()
  })

  it('has proper structure with semantic HTML', () => {
    render(<Footer />)
    
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 3, name: 'AltogetherAgile' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Quick Links' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Contact' })).toBeInTheDocument()
  })
})