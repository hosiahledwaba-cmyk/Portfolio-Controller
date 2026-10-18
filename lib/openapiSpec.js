export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Portfolio Controller Serverless API",
    version: "1.0.0",
    description: "Interactive Serverless API for managing and controlling the developer portfolio web application. Eligible for Vercel Free Tier.",
    contact: {
      name: "Hosiah Ledwaba",
      email: "hosiahledwaba@gmail.com"
    }
  },
  servers: [
    {
      url: "/",
      description: "Current Host"
    },
    {
      url: "http://localhost:4000",
      description: "Local Development Server"
    }
  ],
  tags: [
    { name: "Portfolio", description: "Portfolio details and live state" },
    { name: "System", description: "Diagnostics, authentication, and maintenance" }
  ],
  paths: {
    "/api/portfolio": {
      get: {
        tags: ["Portfolio"],
        summary: "Retrieve current portfolio configuration",
        description: "Returns the full active portfolio dataset (profile, projects, skills, timeline, education, and socials).",
        operationId: "getPortfolio",
        responses: {
          "200": {
            description: "Portfolio details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PortfolioData" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Portfolio"],
        summary: "Update portfolio details",
        description: "Mutates and persists changes to the portfolio. Requires admin passcode authentication.",
        operationId: "updatePortfolio",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          description: "Portfolio fields to update (partial or complete payload)",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PortfolioData"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Portfolio updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Portfolio details updated successfully" },
                    data: { $ref: "#/components/schemas/PortfolioData" },
                    warning: { type: "string" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid JSON payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized: Invalid or missing admin passcode",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/reset": {
      post: {
        tags: ["System"],
        summary: "Reset portfolio to default seed data",
        description: "Restores the portfolio back to the default seed profile (Hosiah Ledwaba). Requires administrator password authentication via 'x-admin-key' header, Bearer token, or request body.",
        operationId: "resetPortfolio",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: false,
          description: "Optional payload providing password authorization directly in JSON body",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  password: {
                    type: "string",
                    description: "Admin passcode authorizing the factory reset",
                    example: "admin123"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Portfolio reset successfully to default seed data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Portfolio reset to default successfully" },
                    data: { $ref: "#/components/schemas/PortfolioData" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized: Invalid or missing admin passcode",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "System health & storage diagnostics",
        description: "Checks if the API is responsive, inspects the current storage provider (Upstash KV or local memory), and checks security configuration.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "API is healthy and operational",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth": {
      post: {
        tags: ["System"],
        summary: "Verify admin passcode",
        description: "Tests if the provided admin passcode is valid without making changes.",
        operationId: "verifyAuth",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        responses: {
          "200": {
            description: "Passcode is valid",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean", example: true },
                    message: { type: "string", example: "Authenticated as Controller Admin" },
                    defaultSecretInUse: { type: "boolean", example: false }
                  }
                }
              }
            }
          },
          "401": {
            description: "Invalid passcode",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    valid: { type: "boolean", example: false },
                    message: { type: "string", example: "Invalid admin passcode" }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["System"],
        summary: "Change admin passcode",
        description: "Updates the administrator passcode from the default admin123 to a secure custom password.",
        operationId: "changePassword",
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "admin123" },
                  newPassword: { type: "string", minLength: 6, example: "MyNewSecurePassword!2026" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Passcode updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Admin passcode updated successfully." }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid password requirements (e.g. too short or same as default)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Current passcode is incorrect",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/github": {
      get: {
        tags: ["Portfolio"],
        summary: "Discover public GitHub repositories",
        description: "Fetches public GitHub repositories for a given or configured username, including descriptions, languages, topics, stars, and URLs.",
        operationId: "getGithubRepos",
        parameters: [
          {
            name: "username",
            in: "query",
            required: false,
            description: "GitHub username to discover repos for (defaults to configured username or hosiahledwaba-cmyk)",
            schema: { type: "string", example: "hosiahledwaba-cmyk" }
          }
        ],
        responses: {
          "200": {
            description: "List of discovered public repositories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    username: { type: "string", example: "hosiahledwaba-cmyk" },
                    count: { type: "integer", example: 10 },
                    repos: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          name: { type: "string" },
                          fullName: { type: "string" },
                          description: { type: "string" },
                          url: { type: "string" },
                          homepage: { type: "string" },
                          language: { type: "string" },
                          topics: { type: "array", items: { type: "string" } },
                          stars: { type: "integer" },
                          forks: { type: "integer" },
                          updatedAt: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "GitHub user not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          },
          "429": {
            description: "GitHub API rate limit exceeded",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-admin-key",
        description: "Custom admin secret passcode header (default in dev: admin123)"
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "Standard HTTP Bearer authorization"
      }
    },
    schemas: {
      PortfolioData: {
        type: "object",
        properties: {
          name: { type: "string", example: "Hosiah Ledwaba" },
          title: { type: "string", example: "Software Engineering Student" },
          heroHeadline: { type: "string", example: "HOSIAH LEDWABA" },
          heroSubtitle: { type: "string", example: "Software Engineering Student & Aspiring Developer" },
          heroTagline: { type: "string", example: "Bridging the gap between Computer Science and Informatics." },
          contact: { $ref: "#/components/schemas/ContactInfo" },
          summary: { type: "string" },
          elevatorPitch: { type: "string" },
          skills: {
            type: "array",
            items: { $ref: "#/components/schemas/SkillItem" }
          },
          projects: {
            type: "array",
            items: { $ref: "#/components/schemas/ProjectItem" }
          },
          experience: {
            type: "array",
            items: { $ref: "#/components/schemas/ExperienceItem" }
          },
          education: {
            type: "array",
            items: { $ref: "#/components/schemas/EducationItem" }
          },
          socialLinks: {
            type: "array",
            items: { $ref: "#/components/schemas/SocialLinkItem" }
          },
          languages: {
            type: "array",
            items: { type: "string" },
            example: ["English", "Sepedi", "Setswana", "Afrikaans", "Zulu"]
          }
        }
      },
      ContactInfo: {
        type: "object",
        properties: {
          phone: { type: "string", example: "+27832868282" },
          email: { type: "string", example: "hosiahledwaba@gmail.com" },
          location: { type: "string", example: "Johannesburg, South Africa" }
        }
      },
      ProjectItem: {
        type: "object",
        properties: {
          title: { type: "string", example: "Swipy E-Commerce Suite" },
          description: { type: "string" },
          outcome: { type: "string" },
          technologies: {
            type: "array",
            items: { type: "string" },
            example: ["Flutter", "React TypeScript", "FastAPI", "Python"]
          },
          image: { type: "string", example: "https://placehold.co/800x600/050505/00E5FF.png?text=E-Commerce+Suite" },
          isPlaceholder: { type: "boolean", example: true },
          placeholderCaption: { type: "string" }
        }
      },
      SkillItem: {
        type: "object",
        properties: {
          name: { type: "string", example: "TypeScript" },
          category: {
            type: "array",
            items: { type: "string" },
            example: ["Language", "Frontend", "Web"]
          },
          level: { type: "integer", minimum: 1, maximum: 10, example: 10 },
          experienceSummary: { type: "string" },
          proficiency: {
            type: "string",
            enum: ["Beginner", "Intermediate", "Experienced", "Expert"],
            example: "Expert"
          },
          typicalUseCases: {
            type: "array",
            items: { type: "string" }
          },
          relevantProjects: { type: "string" }
        }
      },
      ExperienceItem: {
        type: "object",
        properties: {
          role: { type: "string", example: "Software Engineering Student" },
          company: { type: "string", example: "University of Johannesburg" },
          years: { type: "string", example: "2021 - Present" },
          summary: { type: "string" },
          highlights: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      EducationItem: {
        type: "object",
        properties: {
          institution: { type: "string", example: "University of Johannesburg" },
          degree: { type: "string", example: "Bachelor of Science in Information Technology" },
          years: { type: "string", example: "Expected 2026" },
          description: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      SocialLinkItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "linkedin" },
          name: { type: "string", example: "LinkedIn" },
          url: { type: "string", example: "https://www.linkedin.com/in/hosiah-ledwaba" },
          visible: { type: "boolean", example: true },
          title: { type: "string" }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "healthy" },
          service: { type: "string", example: "Portfolio Controller Serverless API" },
          runtime: { type: "string", example: "Node.js (Vercel Serverless Function)" },
          timestamp: { type: "string", format: "date-time" },
          tier: { type: "string", example: "Vercel Free Tier Eligible" },
          storage: {
            type: "object",
            properties: {
              provider: { type: "string", example: "local-memory" },
              configured: { type: "boolean", example: false },
              description: { type: "string" }
            }
          },
          security: {
            type: "object",
            properties: {
              defaultSecretInUse: { type: "boolean", example: true }
            }
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Error message details" }
        }
      }
    }
  }
};
