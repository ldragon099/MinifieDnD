import React from 'react';
import './index.css';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import SingleStep from './accordionSteps';
import { EntityList } from './accordionSteps';

const neo4j = require('neo4j-driver')
const driver = neo4j.driver('bolt://minifiednd.com:7687', neo4j.auth.basic('neo4j', 'goblinMonkeyBaby'))

// CONSTANTS
const NUM_BIOMES = 5;
const NUM_LOCATIONS = 3;
const NUM_CREATURES = 5;
const queries = {
    creatureStart: {
        creatures: '',
        locations: '',
        biomes: '',
        result: ''
    },
    biomeStart: {
        biomes: `MATCH (biome:Biome) RETURN biome`,
        locations: `MATCH (location:Location)-[:IS_IN]->(:Biome {name: $biome}) RETURN location`,
        result: `
MATCH (c1:Creature)-[:LIVES_IN]->(location:Location {name: $location})-[:IS_IN]->(biome:Biome {name: $biome})
RETURN c1 AS creature
UNION MATCH (c2:Creature)-[:LIVES_IN]->(location:Location {name: $location})
RETURN c2 AS creature
UNION MATCH (c3:Creature)-[:LIVES_IN]->(biome:Biome {name: $biome})
RETURN c3 AS creature
        `
    },
    locationStart: {
        locations: '',
        biomes: '',
        result: ''
    }
}

function randomSubset(array, size) {
    let used = [], subset = [], index;
    const arrayLength = array.length;
    while(size > 0) {
        do {
            index = Math.floor(arrayLength*Math.random());
        } while(used.includes(index));
        used.push(index);
        subset.push(array[index]);
        size--;
    }
    return subset;
}

async function QueryGraph(query, params, onComplete) {
    const session = driver.session();
    //const tx = session.beginTransaction();

    const tx1 = session
        .run(query, params)
        .then((results) => {
            return results.records;
        });

    //await tx.commit();
    onComplete(await tx1);
    session.close();
}

function  WorldbuildingSteps() {
    const [selectedBiome, setSelectedBiome] = React.useState("");
    const [selectedLocation, setSelectedLocation] = React.useState("");
    const [biomeListExpanded, setBiomeListExpanded] = React.useState(true);
    const [locationListExpanded, setLocationListExpanded] = React.useState(false);
    const [creatureListExpanded, setCreatureListExpanded] = React.useState(false);
    const [step1Items, setStep1Items] = React.useState([]);
    const [step2Items, setStep2Items] = React.useState([]);
    const [step3Items, setStep3Items] = React.useState([]);
    
    const step1Query = queries.biomeStart.biomes;
    const step2Query = queries.biomeStart.locations;
    const step3Query = queries.biomeStart.result;


    const collapseAll = () => {
        setBiomeListExpanded(false);
        setLocationListExpanded(false);
        setCreatureListExpanded(false);
    }
    const getBiomes = () => {
        QueryGraph(step1Query, {}, setBiomes);
        collapseAll();
        setBiomeListExpanded(true);
    }
    const setBiomes = (step1Records) => {
        let biomeList = step1Records?step1Records.map((biome) => (biome.get('biome').properties.name)):[];
        biomeList = randomSubset(biomeList, NUM_BIOMES);
        setStep1Items(biomeList);
        setSelectedBiome("");
    }
    const getLocations = () => {
        QueryGraph(step2Query, {biome: selectedBiome}, setLocations);
        collapseAll();
        setLocationListExpanded(true);
    }
    const setLocations = (step2Records) => {
        let locationList = step2Records?step2Records.map((location) => (location.get('location').properties.name)):[];
        locationList = randomSubset(locationList, NUM_LOCATIONS);
        setStep2Items(locationList);
        setSelectedLocation("");
    }
    const getCreatures = () => {
        QueryGraph(step3Query, {biome: selectedBiome, location: selectedLocation}, setCreatures);
        collapseAll();
        setCreatureListExpanded(true);
    }
    const setCreatures = (step3Records) => {
        let creatureList = step3Records?step3Records.map((creature) => (creature.get('creature').properties)):[];
        creatureList = randomSubset(creatureList, NUM_CREATURES);
        setStep3Items(creatureList);
    }


    return (
        <div>
            <SingleStep
                title={"Select A Biome" + (selectedBiome?(": " + selectedBiome):"")}
                expanded={biomeListExpanded}
                onMount={getBiomes}
                onSubmit={getLocations}
                submitDisabled={selectedBiome === ""}
            >
                <EntityList items={step1Items} onSelect={setSelectedBiome}/>
            </SingleStep>
            <SingleStep
                title={"Select A Location" + (selectedLocation?(": " + selectedLocation):"")}
                expanded={locationListExpanded}
                disabled={selectedBiome === ""}
                onBack={() => {collapseAll(); setBiomeListExpanded(true);}}
                onSubmit={getCreatures}
                submitDisabled={selectedLocation === ""}
            >
                <EntityList items={step2Items} onSelect={setSelectedLocation}/>
            </SingleStep>
            <SingleStep
                title="Available Creatures"
                expanded={creatureListExpanded}
                disabled={selectedLocation === ""}
                onBack={() => {collapseAll(); setLocationListExpanded(true);}}
            >
                <Grid container spacing={1}>
                    {step3Items.map((creature, index) => (
                        <Grid item sm={3} key={'creature'+index}>
                            <Accordion>
                                <AccordionSummary>
                                    <Typography>{creature.name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography paragraph>
                                        <div>Size: {creature.size}</div><br/>
                                        <div>CR: {creature.cr}</div><br/>
                                        <div>Alignment: {creature.alignment}</div><br/>
                                        <div>Source: {creature.source}</div><br/>
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        </Grid>
                    ))}
                </Grid>
            </SingleStep>
        </div>
    );
}

function WorldbuildingPage() {  
    return (
        <React.StrictMode>
            <Grid container justify="center">
                <Grid item sm={10}>
                    <WorldbuildingSteps/>
                </Grid>
            </Grid>
        </React.StrictMode>
    );
}

export default WorldbuildingPage;