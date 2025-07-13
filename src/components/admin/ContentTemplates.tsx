import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Lightbulb, 
  Target, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Zap,
  CheckCircle,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  fields: {
    name: string;
    summary: string;
    description: string;
    purpose: string;
    difficulty_level: string;
    estimated_reading_time: number;
  };
  tags: string[];
}

const templates: Template[] = [
  {
    id: 'problem-solving',
    name: 'Problem Solving Technique',
    description: 'For systematic approaches to problem resolution',
    category: 'Process',
    icon: Target,
    fields: {
      name: '',
      summary: 'A systematic approach to identify, analyze, and resolve complex problems effectively.',
      description: `
        <h2>Overview</h2>
        <p>This technique provides a structured framework for approaching and solving problems systematically.</p>
        
        <h2>When to Use</h2>
        <ul>
          <li>When facing complex, multi-faceted problems</li>
          <li>When previous solutions haven't worked</li>
          <li>When you need a repeatable process</li>
        </ul>
        
        <h2>Steps</h2>
        <ol>
          <li><strong>Define the Problem:</strong> Clearly articulate what needs to be solved</li>
          <li><strong>Gather Information:</strong> Collect relevant data and context</li>
          <li><strong>Generate Options:</strong> Brainstorm potential solutions</li>
          <li><strong>Evaluate Solutions:</strong> Assess feasibility and impact</li>
          <li><strong>Implement:</strong> Execute the chosen solution</li>
          <li><strong>Monitor Results:</strong> Track effectiveness and adjust as needed</li>
        </ol>
        
        <h2>Benefits</h2>
        <ul>
          <li>Reduces decision-making bias</li>
          <li>Ensures comprehensive analysis</li>
          <li>Improves solution quality</li>
          <li>Creates reusable process</li>
        </ul>
      `,
      purpose: 'To provide a systematic, repeatable approach for solving complex problems effectively.',
      difficulty_level: 'intermediate',
      estimated_reading_time: 8
    },
    tags: ['problem-solving', 'decision-making', 'process', 'analysis']
  },
  {
    id: 'innovation',
    name: 'Innovation Method',
    description: 'For creative thinking and breakthrough solutions',
    category: 'Creative',
    icon: Lightbulb,
    fields: {
      name: '',
      summary: 'A creative methodology for generating innovative ideas and breakthrough solutions.',
      description: `
        <h2>Overview</h2>
        <p>This method stimulates creative thinking to generate novel solutions and innovative approaches.</p>
        
        <h2>Core Principles</h2>
        <ul>
          <li>Challenge assumptions</li>
          <li>Embrace ambiguity</li>
          <li>Build on ideas</li>
          <li>Defer judgment</li>
        </ul>
        
        <h2>Process</h2>
        <ol>
          <li><strong>Divergent Thinking:</strong> Generate as many ideas as possible</li>
          <li><strong>Idea Building:</strong> Combine and enhance concepts</li>
          <li><strong>Convergent Thinking:</strong> Evaluate and refine ideas</li>
          <li><strong>Rapid Prototyping:</strong> Test concepts quickly</li>
          <li><strong>Iteration:</strong> Refine based on feedback</li>
        </ol>
        
        <h2>Tools & Techniques</h2>
        <ul>
          <li>Brainstorming sessions</li>
          <li>Mind mapping</li>
          <li>SCAMPER method</li>
          <li>Design thinking workshops</li>
        </ul>
      `,
      purpose: 'To foster creative thinking and generate innovative solutions to complex challenges.',
      difficulty_level: 'intermediate',
      estimated_reading_time: 10
    },
    tags: ['innovation', 'creativity', 'brainstorming', 'design-thinking']
  },
  {
    id: 'leadership',
    name: 'Leadership Framework',
    description: 'For developing leadership skills and team management',
    category: 'Management',
    icon: Users,
    fields: {
      name: '',
      summary: 'A comprehensive framework for developing effective leadership skills and managing high-performing teams.',
      description: `
        <h2>Overview</h2>
        <p>This framework provides practical guidance for developing leadership capabilities and building effective teams.</p>
        
        <h2>Core Leadership Principles</h2>
        <ul>
          <li>Lead by example</li>
          <li>Communicate with clarity</li>
          <li>Empower team members</li>
          <li>Foster continuous learning</li>
        </ul>
        
        <h2>Key Components</h2>
        <ol>
          <li><strong>Vision Setting:</strong> Define clear direction and goals</li>
          <li><strong>Team Building:</strong> Create cohesive, motivated teams</li>
          <li><strong>Communication:</strong> Establish open, honest dialogue</li>
          <li><strong>Decision Making:</strong> Make informed, timely decisions</li>
          <li><strong>Development:</strong> Coach and mentor team members</li>
        </ol>
        
        <h2>Implementation Tips</h2>
        <ul>
          <li>Start with self-awareness</li>
          <li>Practice active listening</li>
          <li>Provide regular feedback</li>
          <li>Recognize and celebrate successes</li>
        </ul>
      `,
      purpose: 'To develop effective leadership skills and create high-performing, engaged teams.',
      difficulty_level: 'advanced',
      estimated_reading_time: 12
    },
    tags: ['leadership', 'management', 'team-building', 'communication']
  },
  {
    id: 'strategy',
    name: 'Strategic Planning',
    description: 'For long-term planning and strategic thinking',
    category: 'Strategy',
    icon: TrendingUp,
    fields: {
      name: '',
      summary: 'A systematic approach to strategic planning and long-term organizational success.',
      description: `
        <h2>Overview</h2>
        <p>This technique guides organizations through comprehensive strategic planning to achieve long-term success.</p>
        
        <h2>Strategic Planning Process</h2>
        <ol>
          <li><strong>Environmental Analysis:</strong> Assess external opportunities and threats</li>
          <li><strong>Internal Assessment:</strong> Evaluate strengths and weaknesses</li>
          <li><strong>Vision & Mission:</strong> Define organizational purpose and direction</li>
          <li><strong>Goal Setting:</strong> Establish measurable objectives</li>
          <li><strong>Strategy Formulation:</strong> Develop action plans</li>
          <li><strong>Implementation:</strong> Execute strategic initiatives</li>
          <li><strong>Monitoring:</strong> Track progress and adjust course</li>
        </ol>
        
        <h2>Key Tools</h2>
        <ul>
          <li>SWOT Analysis</li>
          <li>PESTLE Framework</li>
          <li>Balanced Scorecard</li>
          <li>Strategic Roadmaps</li>
        </ul>
      `,
      purpose: 'To create comprehensive strategic plans that drive long-term organizational success.',
      difficulty_level: 'advanced',
      estimated_reading_time: 15
    },
    tags: ['strategy', 'planning', 'analysis', 'organizational-development']
  },
  {
    id: 'learning',
    name: 'Learning Methodology',
    description: 'For knowledge acquisition and skill development',
    category: 'Development',
    icon: BookOpen,
    fields: {
      name: '',
      summary: 'An effective methodology for accelerated learning and skill development.',
      description: `
        <h2>Overview</h2>
        <p>This methodology optimizes the learning process for faster knowledge acquisition and skill mastery.</p>
        
        <h2>Learning Principles</h2>
        <ul>
          <li>Active engagement</li>
          <li>Spaced repetition</li>
          <li>Multi-modal learning</li>
          <li>Real-world application</li>
        </ul>
        
        <h2>Learning Cycle</h2>
        <ol>
          <li><strong>Preparation:</strong> Set learning objectives and context</li>
          <li><strong>Acquisition:</strong> Gather new information and concepts</li>
          <li><strong>Processing:</strong> Analyze and understand the material</li>
          <li><strong>Application:</strong> Practice and apply new knowledge</li>
          <li><strong>Reflection:</strong> Evaluate learning and identify gaps</li>
          <li><strong>Reinforcement:</strong> Strengthen understanding through repetition</li>
        </ol>
        
        <h2>Techniques</h2>
        <ul>
          <li>Mind mapping</li>
          <li>Spaced repetition systems</li>
          <li>Peer teaching</li>
          <li>Project-based learning</li>
        </ul>
      `,
      purpose: 'To accelerate learning and improve knowledge retention through structured methodologies.',
      difficulty_level: 'beginner',
      estimated_reading_time: 7
    },
    tags: ['learning', 'education', 'skill-development', 'knowledge-management']
  },
  {
    id: 'optimization',
    name: 'Process Optimization',
    description: 'For improving efficiency and performance',
    category: 'Efficiency',
    icon: Zap,
    fields: {
      name: '',
      summary: 'A systematic approach to analyzing and optimizing processes for maximum efficiency.',
      description: `
        <h2>Overview</h2>
        <p>This technique helps identify bottlenecks and inefficiencies to streamline processes and improve performance.</p>
        
        <h2>Optimization Framework</h2>
        <ol>
          <li><strong>Process Mapping:</strong> Document current state workflows</li>
          <li><strong>Analysis:</strong> Identify bottlenecks and waste</li>
          <li><strong>Design:</strong> Create improved process flows</li>
          <li><strong>Implementation:</strong> Roll out optimized processes</li>
          <li><strong>Measurement:</strong> Track performance improvements</li>
          <li><strong>Continuous Improvement:</strong> Iterate and refine</li>
        </ol>
        
        <h2>Key Metrics</h2>
        <ul>
          <li>Cycle time reduction</li>
          <li>Quality improvements</li>
          <li>Cost savings</li>
          <li>Customer satisfaction</li>
        </ul>
        
        <h2>Tools & Methods</h2>
        <ul>
          <li>Value stream mapping</li>
          <li>Root cause analysis</li>
          <li>Lean methodologies</li>
          <li>Six Sigma tools</li>
        </ul>
      `,
      purpose: 'To systematically improve process efficiency and eliminate waste for better performance.',
      difficulty_level: 'intermediate',
      estimated_reading_time: 9
    },
    tags: ['optimization', 'efficiency', 'process-improvement', 'lean']
  }
];

interface ContentTemplatesProps {
  onUseTemplate: (template: Template) => void;
}

export const ContentTemplates = ({ onUseTemplate }: ContentTemplatesProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const handleUseTemplate = (template: Template) => {
    onUseTemplate(template);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been applied to the form.`,
    });
  };

  const copyTemplate = (template: Template) => {
    const templateData = JSON.stringify(template.fields, null, 2);
    navigator.clipboard.writeText(templateData);
    toast({
      title: "Template Copied",
      description: "Template data copied to clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Templates</h3>
        <Badge variant="secondary">{templates.length} Templates Available</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <template.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{template.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-4">
                {template.description}
              </CardDescription>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <template.icon className="h-5 w-5" />
                        {template.name}
                      </DialogTitle>
                      <DialogDescription>
                        {template.description}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          {template.fields.summary}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Content Preview</h4>
                        <div 
                          className="prose prose-sm max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: template.fields.description }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge>
                          {template.fields.difficulty_level}
                        </Badge>
                        <Badge variant="outline">
                          {template.fields.estimated_reading_time} min read
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => handleUseTemplate(template)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                        <Button variant="outline" onClick={() => copyTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  onClick={() => handleUseTemplate(template)}
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};