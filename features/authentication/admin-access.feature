Feature: Admin Access Control
  As a system administrator
  I want to control access to admin features
  So that only authorized users can manage content

  @authentication
  Scenario: Successful admin login
    Given I am on the login page
    When I enter valid admin credentials
    And I click the login button
    Then I should be redirected to the admin dashboard
    And I should see the admin navigation menu

  @authorization
  Scenario: Access protected admin routes
    Given I am logged in as an admin user
    When I navigate to the knowledge base management page
    Then I should have access to all admin features
    And I should see the content management interface

  @unauthorized-access
  Scenario: Prevent unauthorized access
    Given I am not logged in
    When I try to access the admin knowledge base page directly
    Then I should be redirected to the login page
    And I should see "Please log in to access this page"

  @session-management
  Scenario: Handle session expiration
    Given I am logged in as an admin user
    And my session has expired
    When I try to perform an admin action
    Then I should be redirected to the login page
    And I should see "Your session has expired"