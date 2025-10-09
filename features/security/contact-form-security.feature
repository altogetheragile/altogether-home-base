Feature: Contact Form Security
  As a system administrator
  I want the contact form to be protected against abuse
  So that the system remains secure and reliable

  @security @rate-limiting
  Scenario: Rate limiting prevents spam
    Given I am on the home page
    When I submit a contact form
    And I immediately try to submit another contact form
    Then I should see an error message "Rate limit exceeded"
    And the second submission should be blocked

  @security @validation
  Scenario: Input validation prevents injection
    Given I am on the home page
    When I try to submit a contact form with:
      | field   | value                           |
      | name    | <script>alert('xss')</script>   |
      | email   | invalid-email                   |
      | message | x                               |
    Then I should see validation errors
    And the form should not be submitted

  @security @validation
  Scenario: Maximum length enforcement
    Given I am on the home page
    When I try to submit a contact form with a 3000 character message
    Then I should see an error "Message must be less than 2000 characters"
    And the form should not be submitted

  @security
  Scenario: Successful submission after rate limit expires
    Given I submitted a contact form 6 minutes ago
    When I submit a new contact form
    Then the submission should be successful
    And I should see a success message
