import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, ListItem, ListItemText, Typography, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/matches/');
        setMatches(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return <Typography>Loading matches...</Typography>;

  return (
    <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Upcoming & Live Matches</Typography>
      <List>
        {matches.map(match => (
          <ListItem 
            button 
            key={match.id} 
            component={Link} 
            to={`/match/${match.id}`}
          >
            <ListItemText
              primary={`${match.team1.name} vs ${match.team2.name}`}
              secondary={`${new Date(match.date).toLocaleString()} | ${match.venue}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default MatchesPage;